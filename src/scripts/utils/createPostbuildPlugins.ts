import { mkdir, readdir, rename, rm } from "node:fs/promises";
import type { Plugin } from "esbuild";
import type { BuildParams } from "../types/BuildParams.ts";

export function createPostbuildPlugins(
  { serverDir, clientDir }: BuildParams,
  onServerRebuild: () => void,
) {
  let serverPlugins: Plugin[] = [
    {
      name: "skip-css",
      setup(build) {
        /** @see https://github.com/evanw/esbuild/issues/599#issuecomment-745118158 */
        build.onLoad({ filter: /\.css$/ }, () => ({ contents: "" }));
      },
    },
    {
      name: "postbuild-server",
      setup(build) {
        build.onEnd(() => {
          onServerRebuild();
        });
      },
    },
  ];

  let serverCSSPlugins: Plugin[] = [
    {
      name: "postbuild-server-css",
      setup(build) {
        build.onEnd(async () => {
          let dir = `${serverDir}/server-css`;

          try {
            let files = (await readdir(dir)).filter((name) =>
              name.endsWith(".css"),
            );

            if (files.length === 0) return;

            await mkdir(clientDir, { recursive: true });

            await Promise.all(
              files.map(async (name) => {
                let dir = `${clientDir}/${name.slice(0, -4)}`;

                await mkdir(dir, { recursive: true });
                await rename(
                  `${serverDir}/server-css/${name}`,
                  `${dir}/index.css`,
                );
              }),
            );

            await rm(dir, { recursive: true, force: true });
          } catch {}
        });
      },
    },
  ];

  return {
    serverPlugins,
    serverCSSPlugins,
  };
}
