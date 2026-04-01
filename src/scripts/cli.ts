import { rm } from "node:fs/promises";
import { Args } from "args-json";
import { build } from "./build.ts";
import type { BuildParams } from "./types/BuildParams.ts";

async function clean({ serverDir, clientDir }: BuildParams) {
  let dirs = [`${serverDir}/server`, `${serverDir}/server-css`, clientDir];

  return Promise.all(
    dirs.map((dir) => rm(dir, { recursive: true, force: true })),
  );
}

export async function cli(input: string[] = []) {
  let args = new Args(input);

  let clientDir = args.getValue("--client-dir");
  let serverDir = args.getValue("--server-dir", "dist");

  if (!clientDir) throw new Error("Public assets directory is undefined");

  let params: BuildParams = {
    serverDir,
    clientDir,
    silent: args.hasKey("--silent"),
    watch: args.hasKey("--watch"),
    watchServer: args.hasKey("--watch-server"),
    watchClient: args.hasKey("--watch-client"),
    start: args.hasKey("--start"),
  };

  if (args.hasKey("--no-auto-entries")) params.entriesPath = null;

  if (args.hasKey("--clean-only")) {
    await clean(params);
    return;
  }

  if (args.hasKey("--clean")) await clean(params);

  await build(params);
}
