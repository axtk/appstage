import type { BuildOptions } from "esbuild";

export const commonBuildOptions: Partial<BuildOptions> = {
  format: "cjs",
  jsx: "automatic",
  jsxDev: process.env.NODE_ENV === "development",
  loader: {
    ".png": "dataurl",
    ".svg": "dataurl",
    ".html": "text",
    ".txt": "text",
  },
};
