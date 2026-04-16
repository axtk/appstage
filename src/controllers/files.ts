import { lstat, readFile } from "node:fs/promises";
import { basename, extname, join } from "node:path";
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
    if ((await lstat(fullPath)).isFile()) return fullPath;
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
  extensions?: string[];
  languages?: (req: Request) => string[];
  transform?: TransformContent[];
};

const defaultExtensions = ["html", "htm"];
const defaultPath = (req: Request) => req.path;
const defaultLanguages = getLanguageList;

/**
 * Serves files from the specified directory path in a locale-aware
 * fashion after applying optional transforms.
 */
export const files: Controller<string | FilesParams> = (params) => {
  let p: FilesParams = typeof params === "string" ? { base: params } : params;

  let bases = Array.isArray(p.base) ? p.base : [p.base];
  let exts = p.extensions ?? defaultExtensions;

  return async (req, res) => {
    let langs = (p.languages ?? defaultLanguages)(req);

    let path =
      typeof p.path === "string" ? p.path : (p.path ?? defaultPath)(req);

    if (!matches(path, p.matches)) {
      emitLog(req.app, "Unmatched path", { data: { path } });

      res.status(404).send(
        await req.app.renderStatus?.(req, res, {
          code: "unmatched_path",
          path,
        }),
      );

      return;
    }

    if (path.includes("../")) {
      emitLog(req.app, "Invalid path (potential traversal attempt)", {
        data: { path },
      });

      res.status(400).send(
        await req.app.renderStatus?.(req, res, {
          code: "invalid_path",
          path,
        }),
      );

      return;
    }

    let filePath: string | null = null;

    // path: /x
    // langs: en, ru
    for (let k = 0; k < bases.length && filePath === null; k++) {
      let base = bases[k];

      if (!path.endsWith("/")) {
        // /x.en /x.ru
        for (let i = 0; i < langs.length && filePath === null; i++)
          filePath = await resolve(base, `${path}.${langs[i]}`);

        // /x
        if (filePath === null) filePath = await resolve(base, path);

        // /x.en.html /x.en.htm /x.ru.html /x.ru.htm
        for (let i = 0; i < langs.length && filePath === null; i++) {
          for (let j = 0; j < exts.length && filePath === null; j++)
            filePath = await resolve(base, `${path}.${langs[i]}.${exts[j]}`);
        }

        // /x.html /x.htm
        for (let i = 0; i < exts.length && filePath === null; i++)
          filePath = await resolve(base, `${path}.${exts[i]}`);
      }

      // /x.en/index.html /x.en/index.htm /x.ru/index.html /x.ru/index.htm
      for (let i = 0; i < langs.length && filePath === null; i++) {
        for (let j = 0; j < exts.length && filePath === null; j++)
          filePath = await resolve(
            base,
            `${path}.${langs[i]}`,
            `index.${exts[j]}`,
          );
      }

      // /x/index.en.html /x/index.en.htm /x/index.ru.html /x/index.ru.htm
      for (let i = 0; i < langs.length && filePath === null; i++) {
        for (let j = 0; j < exts.length && filePath === null; j++)
          filePath = await resolve(base, path, `index.${langs[i]}.${exts[j]}`);
      }

      // /x/index.html /x/index.htm
      for (let i = 0; i < exts.length && filePath === null; i++)
        filePath = await resolve(base, path, `index.${exts[i]}`);
    }

    if (filePath === null) {
      emitLog(req.app, "Unknown path", { data: { path } });

      res.status(404).send(
        await req.app.renderStatus?.(req, res, {
          code: "unknown_path",
          path,
        }),
      );

      return;
    }

    if (!p.transform?.length) {
      res.sendFile(filePath);
      return;
    }

    let content = (await readFile(filePath)).toString();
    let ext = extname(filePath);
    let name = basename(filePath, ext);

    for (let transform of p.transform) {
      let result = transform(req, res, { content, path: filePath, name });

      content = result instanceof Promise ? await result : result;
    }

    res.type(ext.slice(1)).send(content);
  };
};
