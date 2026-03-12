import { access } from "node:fs/promises";
import { join } from "node:path";
import { entryExtensions } from "../const/entryExtensions.ts";

export async function getFirstAvailable(
  dirPath: string,
  path: string | string[],
) {
  let paths = Array.isArray(path) ? path : [path];

  for (let filePath of paths) {
    for (let ext of entryExtensions) {
      let path = join(process.cwd(), dirPath, `${filePath}.${ext}`);

      try {
        await access(path);

        return path;
      } catch {}
    }
  }
}
