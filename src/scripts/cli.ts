import { rm } from "node:fs/promises";
import { build } from "./build.ts";
import type { BuildParams } from "./types/BuildParams.ts";

const defaultTargetDir = "dist";

async function clean({ targetDir, publicAssetsDir }: BuildParams) {
  let dirs = [
    `${targetDir}/server`,
    `${targetDir}/server-css`,
    `${publicAssetsDir}/-`,
  ];

  return Promise.all(
    dirs.map((dir) => rm(dir, { recursive: true, force: true })),
  );
}

export async function cli(args: string[] = []) {
  let publicAssetsDir = args[0];
  let targetDir = args[1];

  if (!publicAssetsDir || publicAssetsDir.startsWith("--"))
    throw new Error("Public assets directory is undefined");

  if (!targetDir || targetDir.startsWith("--")) targetDir = defaultTargetDir;

  let params: BuildParams = {
    targetDir,
    publicAssetsDir,
    silent: args.includes("--silent"),
    watch: args.includes("--watch"),
    watchServer: args.includes("--watch-server"),
    watchClient: args.includes("--watch-client"),
    start: args.includes("--start"),
  };

  if (args.includes("--clean-only")) {
    await clean(params);
    return;
  }

  if (args.includes("--clean")) await clean(params);

  await build(params);
}
