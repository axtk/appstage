import { cli } from "./cli.ts";

export async function start(nodeEnv = "development", host?: string) {
  if (nodeEnv) process.env.NODE_ENV = nodeEnv;

  if (host) {
    let [hostname, port] = host.split(":");

    if (hostname) process.env.APP_HOST = hostname;
    if (port) process.env.APP_PORT = port;
  }

  await cli(
    nodeEnv === "development"
      ? ["src/public", "--clean", "--start", "--watch"]
      : ["src/public", "--clean", "--start", "--silent"],
  );
}
