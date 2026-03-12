import { randomBytes } from "node:crypto";
import type { Middleware } from "../types/Middleware.ts";
import { emitLog } from "../utils/emitLog.ts";

/**
 * Initializes the request context on `req.ctx`.
 */
export const init: Middleware = () => (req, res, next) => {
  req.ctx = {
    ...req.ctx,
    id: randomBytes(16).toString("hex"),
    nonce: randomBytes(8).toString("hex"),
    startTime: Date.now(),
  };

  emitLog(req.app, "Inited", {
    req,
    res,
  });

  next();
};
