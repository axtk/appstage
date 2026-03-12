import EventEmitter from "node:events";
import express from "express";
import { log } from "../lib/logger/log.ts";
import { requestEvents } from "../middleware/requestEvents.ts";
import { init } from "../middleware/init.ts";
import type { LogEventPayload } from "../types/LogEventPayload.ts";
import { emitLog } from "./emitLog.ts";
import { renderStatus } from "./renderStatus.ts";

export function createApp(callback?: () => void | Promise<void>) {
  let app = express();

  if (!app.events) app.events = new EventEmitter();

  let host = process.env.APP_HOST || "localhost";
  let port = Number(process.env.APP_PORT) || 80;

  let listen = () => {
    app.listen(port, host, () => {
      let location = `http://${host}:${port}/`;
      let env = `NODE_ENV=${process.env.NODE_ENV}`;

      emitLog(app, `Server running at ${location} (${env})`);
    });
  };

  if (process.env.NODE_ENV === "development")
    app.events?.on("log", ({ message, ...payload }: LogEventPayload) => {
      log(message, payload);
    });

  if (!app.renderStatus) app.renderStatus = renderStatus;

  app.disable("x-powered-by");
  app.use(init());
  app.use(requestEvents());

  let callbackResult = typeof callback === "function" ? callback() : null;

  if (callbackResult instanceof Promise) callbackResult.then(listen);
  else listen();

  return app;
}
