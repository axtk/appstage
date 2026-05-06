import { type ChildProcess, spawn } from "node:child_process";
import { access } from "node:fs/promises";
import { formatDuration } from "dateshape";
import type { BuildParams } from "./types/BuildParams.ts";
import { buildClient } from "./utils/buildClient.ts";
import { buildServer } from "./utils/buildServer.ts";
import { buildServerCSS } from "./utils/buildServerCSS.ts";
import { createPostbuildPlugins } from "./utils/createPostbuildPlugins.ts";

const envFileNames: Record<string, string[]> = {
  development: [".env.development", ".env.dev"],
  production: [".env.production", ".env.prod"],
};

async function getEnvFiles() {
  let { NODE_ENV } = process.env;
  let names = [".env"];

  if (NODE_ENV !== undefined && NODE_ENV in envFileNames)
    names.push(...envFileNames[NODE_ENV]);

  for (let i = names.length - 1; i >= 0; i--) {
    try {
      await access(names[i]);
    } catch {
      names.splice(i, 1);
    }
  }

  return names;
}

export async function build(params: BuildParams) {
  let startTime = Date.now();
  let log = params.silent ? () => {} : console.log;

  log("Build started");

  let serverProcess: ChildProcess | null = null;
  let inited = false;

  let nodeArgs = [`${params.serverDir}/server/index.js`];
  let envFiles: string[] | null = null;

  if (params.useEnvFiles !== false) {
    envFiles = await getEnvFiles();
    nodeArgs.unshift(...envFiles.map((file) => `--env-file=${file}`));
  }

  function handleServerRebuild() {
    if (serverProcess) {
      serverProcess.kill();
      serverProcess = null;
    }

    if (!inited) {
      log(`Build completed +${formatDuration(Date.now() - startTime)}`);

      if (envFiles) {
        for (let envFile of envFiles) log(`Using ${envFile}`);
      }

      inited = true;
    }

    if (params.start)
      serverProcess = spawn("node", nodeArgs, { stdio: "inherit" });
  }

  let { serverPlugins, serverCSSPlugins } = createPostbuildPlugins(
    params,
    handleServerRebuild,
  );

  await Promise.all([
    buildServer(params, serverPlugins),
    buildServerCSS(params, serverCSSPlugins),
    buildClient(params),
  ]);
}
