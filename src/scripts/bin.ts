#!/usr/bin/env node
import { cli } from "./cli.ts";

const availableScriptNames = new Set(["build", "dev", "prod"]);

const nodeEnvMap: Record<string, string> = {
  dev: "development",
  prod: "production",
};

async function run() {
  let [scriptName, ...args] = process.argv.slice(2);

  if (!availableScriptNames.has(scriptName)) {
    console.error("Provide a script name: 'build', 'dev', or 'prod'");
    return;
  }

  if (scriptName === "build") return await cli(args);

  let nodeEnv = nodeEnvMap[scriptName];
  let host = args.shift();

  if (nodeEnv !== undefined) process.env.NODE_ENV = nodeEnv;

  if (host) {
    let [hostname, port] = host.split(":");

    if (hostname) process.env.APP_HOST = hostname;
    if (port) process.env.APP_PORT = port;
  }

  await cli(
    nodeEnv === "development"
      ? ["src/public", "--clean", "--start", "--watch", ...args]
      : ["src/public", "--clean", "--start", "--silent", ...args],
  );
}

await run();
