export type BuildParams = {
  targetDir: string;
  publicAssetsDir: string;
  silent?: boolean;
  watch?: boolean;
  watchClient?: boolean;
  watchServer?: boolean;
  start?: boolean;
};
