import type { Controller } from "../types/Controller.ts";
import { emitLog } from "../utils/emitLog.ts";

export type RedirectParams = {
  url: string;
  status?: number;
};

export const redirect: Controller<string | RedirectParams> = (params) => {
  let { url, status = 302 } =
    typeof params === "string" ? { url: params } : params;

  return (req, res) => {
    let search = req.originalUrl.split("?")[1] ?? "";

    if (search) search = `${url.includes("?") ? "&" : "?"}${search}`;

    emitLog(req.app, "Redirecting", {
      data: {
        from: req.originalUrl,
        to: `${url}${search}`,
      },
      req,
      res,
    });

    res.redirect(status, `${url}${search}`);
  };
};
