import { lstat, readdir } from "node:fs/promises";
import { join } from "node:path";

export async function getEntries() {
  let cwd = process.cwd();

  try {
    let list = await readdir(join(cwd, "src/entries"));

    let dirs = await Promise.all(
      list.map(async (name) => {
        let itemStat = await lstat(join(cwd, "src/entries", name));

        return itemStat.isDirectory() ? name : undefined;
      }),
    );

    return dirs.filter((dir) => dir !== undefined);
  } catch {
    return [];
  }
}
