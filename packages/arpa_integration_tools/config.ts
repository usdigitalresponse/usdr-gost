export interface Config {
  srcPath: string;
  srcRepoName: string;
  destPath: string;
  copies: { [oldPathGlob: string]: string /* new path */ };
  importRewrites: { [oldPath: string]: string /* new path */ };
}
