import { lstat, readFile } from "node:fs/promises";
import { basename, extname, join, resolve as resolveAbsPath } from "node:path";
import type { Request } from "express";
import type { Controller } from "../types/Controller.ts";
import type { TransformContent } from "../types/TransformContent.ts";
import { emitLog } from "../utils/emitLog.ts";

type StringMatcher =
  | string
  | RegExp
  | (string | RegExp)[]
  | ((x: string) => boolean)
  | null;

const maxLanguages = 3;

async function resolve(...parts: string[]) {
  let fullPath = join(...parts);
  try {
    if ((await lstat(fullPath)).isFile()) return resolveAbsPath(fullPath);
  } catch {}
  return null;
}

// ["en-US", "ru"] > ["en-US", "en", "ru"]
function getLanguageList(req: Request) {
  let langParam = req.query.lang;

  if (langParam) return [String(langParam)];

  let acceptedLanguages = req.acceptsLanguages();
  let langs = new Set<string>();

  for (let i = 0; i < acceptedLanguages.length && i < maxLanguages; i++) {
    let s = acceptedLanguages[i];
    let [lang] = s.split(/[-_]/);

    if (s === lang) langs.add(s);
    else {
      langs.add(s);
      langs.add(lang);
    }
  }

  return Array.from(langs);
}

function matches(x: string, matcher: StringMatcher | undefined) {
  if (matcher === null || matcher === undefined) return true;

  if (typeof matcher === "function") return matcher(x);

  let patterns = Array.isArray(matcher) ? matcher : [matcher];

  for (let pattern of patterns) {
    if (pattern instanceof RegExp) {
      if (pattern.test(x)) return true;
    } else if (pattern === x) return true;
  }

  return false;
}

export type FilesParams = {
  base: string | string[];
  path?: string | ((req: Request) => string);
  /** Specifies which paths should be accepted. */
  matches?: StringMatcher;
  /**
   * @default ["html", "htm"]
   */
  extensions?: string[];
  languages?: (req: Request) => string[];
  /**
   * Assumed file language if unspecified in the file name.
   *
   * @default "en"
   */
  defaultLanguage?: string | ((req: Request) => string);
  transform?: TransformContent[];
  fallthrough?: boolean;
};

const defaultExtensions = ["html", "htm"];
const defaultPath = (req: Request) => req.path;

/**
 * Serves files from the specified directory path or paths in a locale-aware
 * fashion after applying optional transforms.
 */
export const files: Controller<string | FilesParams> = (params) => {
  let p: FilesParams = typeof params === "string" ? { base: params } : params;

  let bases = Array.isArray(p.base) ? p.base : [p.base];
  let exts = p.extensions ?? defaultExtensions;
  let fallthrough = p.fallthrough ?? true;

  return async (req, res, next) => {
    let urlPath =
      typeof p.path === "string" ? p.path : (p.path ?? defaultPath)(req);

    let defaultLanguage =
      typeof p.defaultLanguage === "function"
        ? p.defaultLanguage(req)
        : (p.defaultLanguage ?? "en");

    if (!matches(urlPath, p.matches)) {
      if (fallthrough) next();
      else {
        emitLog(req.app, "Unmatched path", { data: { urlPath } });

        res.status(404).send(
          await req.app.renderStatus?.(req, res, {
            code: "unmatched_path",
            urlPath,
          }),
        );
      }

      return;
    }

    if (urlPath.includes("../")) {
      if (fallthrough) next();
      else {
        emitLog(req.app, "Invalid path (potential traversal attempt)", {
          data: { urlPath },
        });

        res.status(400).send(
          await req.app.renderStatus?.(req, res, {
            code: "invalid_path",
            urlPath,
          }),
        );
      }

      return;
    }

    let filePath: string | null = null;
    let urlExt = extname(urlPath);

    let langs = (p.languages ?? getLanguageList)(req);
    let defaultLanguageIndex = langs.indexOf(defaultLanguage);

    let suffixes = langs.map((s) => `.${s}`);

    // Check the suffixless path right after the default language suffix.
    if (defaultLanguageIndex === -1) suffixes.push("");
    else suffixes.splice(defaultLanguageIndex + 1, 0, "");

    // Example:
    // path = /x, langs = [en, ru], default lang: en, exts = [html, htm]
    for (let k = 0; k < bases.length && filePath === null; k++) {
      let base = bases[k];

      if (!urlPath.endsWith("/")) {
        if (filePath === null && urlExt) {
          let urlPathBase = urlPath.slice(0, -urlExt.length);

          // /x.en.ext /x.ext /x.ru.ext
          for (let i = 0; i < suffixes.length && filePath === null; i++)
            filePath = await resolve(
              base,
              `${urlPathBase}${suffixes[i]}${urlExt}`,
            );
        }

        // /x.en /x /x.ru
        for (let i = 0; i < suffixes.length && filePath === null; i++)
          filePath = await resolve(base, `${urlPath}${suffixes[i]}`);

        // /x.en.html /x.en.htm /x.html /x.htm /x.ru.html /x.ru.htm
        for (let i = 0; i < suffixes.length && filePath === null; i++) {
          for (let j = 0; j < exts.length && filePath === null; j++)
            filePath = await resolve(
              base,
              `${urlPath}${suffixes[i]}.${exts[j]}`,
            );
        }
      }

      // /x/index.en.html /x/index.en.htm /x/index.html /x/index.htm /x/index.ru.html /x/index.ru.htm
      for (let i = 0; i < suffixes.length && filePath === null; i++) {
        for (let j = 0; j < exts.length && filePath === null; j++)
          filePath = await resolve(
            base,
            urlPath,
            `index${suffixes[i]}.${exts[j]}`,
          );
      }
    }

    if (filePath === null) {
      if (fallthrough) next();
      else {
        emitLog(req.app, "Unknown path", { data: { urlPath } });

        res.status(404).send(
          await req.app.renderStatus?.(req, res, {
            code: "unknown_path",
            urlPath,
          }),
        );
      }

      return;
    }

    if (!p.transform?.length) {
      res.sendFile(filePath);
      return;
    }

    let content = (await readFile(filePath)).toString();
    let fileExt = extname(filePath);
    let fileName = basename(filePath, fileExt);

    for (let transform of p.transform) {
      let result = transform(req, res, {
        content,
        path: filePath,
        name: fileName,
      });

      content = result instanceof Promise ? await result : result;
    }

    res.type(fileExt.slice(1)).send(content);
  };
};
