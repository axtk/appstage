import esbuild, { type BuildOptions, type Plugin } from "esbuild";
import { commonBuildOptions } from "../const/commonBuildOptions.ts";
import type { BuildParams } from "../types/BuildParams.ts";
import { populateEntries } from "./populateEntries.ts";

const appServerEntryPoints = ["src/server/index.ts"];

export async function buildServer(params: BuildParams, plugins?: Plugin[]) {
  let { serverDir, watch, watchServer } = params;

  await populateEntries(params);

  let buildOptions: BuildOptions = {
    ...commonBuildOptions,
    entryPoints: appServerEntryPoints,
    bundle: true,
    splitting: true,
    outdir: `${serverDir}/server`,
    platform: "node",
    format: "esm",
    packages: "external",
    plugins,
  };

  if (watch || watchServer) {
    let ctx = await esbuild.context(buildOptions);

    await ctx.watch();

    return async () => {
      await ctx.dispose();
    };
  }

  await esbuild.build(buildOptions);
}
