export type BuildParams = {
  targetDir: string;
  publicAssetsDir: string;
  silent?: boolean;
  watch?: boolean;
  watchClient?: boolean;
  watchServer?: boolean;
  start?: boolean;
  /**
   * A file path that the automatically picked entry exports will be
   * written to.
   *
   * Set it to `null` to skip the automatic picking of entry exports.
   *
   * @default "src/server/entries.ts"
   */
  entriesPath?: string | null;
};
