#!/usr/bin/env node
import { hasKey, isKey } from "args-json";
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

  if (nodeEnv !== undefined) process.env.NODE_ENV = nodeEnv;

  if (args.length !== 0 && args[0] && !isKey(args[0])) {
    process.env.APP_URL = args[0];
    args.shift();
  }

  if (!hasKey("--client-dir")) args.push("--client-dir", "src/public/-");

  await cli(
    nodeEnv === "development"
      ? ["--clean", "--start", "--watch", ...args]
      : ["--clean", "--start", "--silent", ...args],
  );
}

await run();
