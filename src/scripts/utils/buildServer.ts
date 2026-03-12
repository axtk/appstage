import esbuild, { type BuildOptions, type Plugin } from "esbuild";
import { commonBuildOptions } from "../const/commonBuildOptions.ts";
import type { BuildParams } from "../types/BuildParams.ts";
import { populateEntries } from "./populateEntries.ts";

export async function buildServer(
  { targetDir, watch, watchServer }: BuildParams,
  plugins?: Plugin[],
) {
  await populateEntries();

  let buildOptions: BuildOptions = {
    ...commonBuildOptions,
    entryPoints: ["src/server/index.ts"],
    bundle: true,
    splitting: true,
    outdir: `${targetDir}/server`,
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
