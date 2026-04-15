import esbuild, { type BuildOptions, type Plugin } from "esbuild";
import { commonBuildOptions } from "../const/commonBuildOptions.ts";
import type { BuildParams } from "../types/BuildParams.ts";
import { getEntryPoints } from "./getEntryPoints.ts";

const entryClientPaths = ["ui/index", "client/index", "index", "src/index"];

/**
 * Builds the client-side code.
 */
export async function buildClient(
  { clientDir, watch, watchClient }: BuildParams,
  plugins?: Plugin[],
) {
  let clientEntries = await getEntryPoints(entryClientPaths);

  let buildOptions: BuildOptions = {
    ...commonBuildOptions,
    entryPoints: clientEntries.map(({ path }) => path),
    bundle: true,
    splitting: true,
    format: "esm",
    outdir: clientDir,
    outbase: "src/entries",
    minify: process.env.NODE_ENV !== "development",
    plugins,
  };

  if (watch || watchClient) {
    let ctx = await esbuild.context(buildOptions);

    await ctx.watch();

    return async () => {
      await ctx.dispose();
    };
  }

  await esbuild.build(buildOptions);
}
