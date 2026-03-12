import esbuild, { type BuildOptions, type Plugin } from "esbuild";
import { commonBuildOptions } from "../const/commonBuildOptions.ts";
import type { BuildParams } from "../types/BuildParams.ts";
import { getEntryPoints } from "./getEntryPoints.ts";

/**
 * Builds the client-side code from the 'src/entries/<entry_name>/ui'
 * directories. The directories should preferrably be called 'ui' rather
 * than client since their contents can also be used with the server-side
 * rendering.
 */
export async function buildClient(
  { publicAssetsDir, watch, watchClient }: BuildParams,
  plugins?: Plugin[],
) {
  let clientEntries = await getEntryPoints(["ui/index"]);

  let buildOptions: BuildOptions = {
    ...commonBuildOptions,
    entryPoints: clientEntries.map(({ path }) => path),
    bundle: true,
    splitting: true,
    format: "esm",
    outdir: `${publicAssetsDir}/-`,
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
