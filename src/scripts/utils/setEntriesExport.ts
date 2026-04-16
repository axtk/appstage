import { writeFile } from "node:fs/promises";
import type { BuildParams } from "../types/BuildParams.ts";
import { getEntryPoints } from "./getEntryPoints.ts";
import { toImportPath } from "./toImportPath.ts";

export async function setEntriesExport({ entriesPath }: BuildParams) {
  if (entriesPath === null) return;

  let serverEntries = await getEntryPoints(["server", "server/index"]);
  let content = "";

  if (serverEntries.length === 0) content = "export const entries = [];";
  else {
    content = "export const entries = (\n  await Promise.all([";

    for (let i = 0; i < serverEntries.length; i++)
      content += `\n    import("${toImportPath(serverEntries[i].path, "src/server")}"),`;

    content += "\n  ])\n).map(({ server }) => server);";
  }

  await writeFile(
    entriesPath ?? "src/server/entries.ts",
    `// Populated automatically during the build phase by picking
// all server exports from "src/entries/<entry_name>/server(/index)?.(js|ts)".
// Ignore this file if a custom set of entry exports is required.
${content}
`,
  );
}
