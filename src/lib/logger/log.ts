import { formatDate, formatDuration } from "dateshape";
import { ansiEscapeCodes } from "./ansiEscapeCodes.ts";
import type { LogOptions } from "./LogOptions.ts";
import { levelColors } from "./levelColors.ts";

function isEmpty(x: unknown) {
  if (x === null || x === undefined || x === "") return true;
  if (Array.isArray(x) && x.length === 0) return true;
  if (typeof x === "object" && Object.keys(x).length === 0) return true;

  return false;
}

export function log(
  message: string | Error | undefined = "",
  { timestamp, level, data, req }: LogOptions = {},
): void {
  let currentTime = timestamp ?? Date.now();
  let error: Error | null = null;

  if (message instanceof Error) {
    error = message;
    message = error.message;

    data = {
      error,
      data,
    };

    if (!level) level = "error";
  }

  if (data instanceof Error) {
    error = data;

    if (data.message)
      message = `${message ? `${message} - ` : ""}${data.message}`;

    if (!level) level = "error";
  }

  if (!level) level = "info";

  let levelCode = ansiEscapeCodes[levelColors[level]] ?? "";
  let requestTarget = req ? `${req.method} ${req.originalUrl}` : "";

  let { startTime, id: sessionId } = req?.ctx ?? {};

  console[level]();

  console[level](
    levelCode +
      ansiEscapeCodes.dim +
      formatDate(currentTime, "{isoDate} {isoTimeMs} {tz}") +
      (sessionId ? ` <${sessionId}>` : "") +
      (startTime === undefined
        ? ""
        : ` +${formatDuration(currentTime - startTime)}`) +
      ansiEscapeCodes.reset,
  );

  console[level](
    levelCode +
      requestTarget +
      (requestTarget && message && !message.startsWith("\n") ? " - " : "") +
      message +
      ansiEscapeCodes.reset,
  );

  if (!isEmpty(data))
    console[level](
      levelCode +
        ansiEscapeCodes.dim +
        (typeof data === "string" ? data : JSON.stringify(data, null, 2)) +
        ansiEscapeCodes.reset,
    );

  if (error?.stack)
    console[level](
      levelCode + ansiEscapeCodes.dim + error.stack + ansiEscapeCodes.reset,
    );
}
