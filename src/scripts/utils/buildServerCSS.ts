import esbuild, { type BuildOptions, type Plugin } from "esbuild";
import { commonBuildOptions } from "../const/commonBuildOptions.ts";
import type { BuildParams } from "../types/BuildParams.ts";
import { getEntryPoints } from "./getEntryPoints.ts";

export async function buildServerCSS(
  { targetDir, watch, watchServer }: BuildParams,
  plugins?: Plugin[],
) {
  let serverEntries = await getEntryPoints(["server", "server/index"]);

  let buildOptions: BuildOptions = {
    ...commonBuildOptions,
    entryPoints: serverEntries.map(({ name, path }) => ({
      in: path,
      out: name,
    })),
    bundle: true,
    splitting: false,
    outdir: `${targetDir}/server-css`,
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
