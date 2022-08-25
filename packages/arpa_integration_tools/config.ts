export interface Config {
  srcPath: string;
  srcRepoName: string;
  destPath: string;
  copies: { [oldPathGlob: string]: string /* new path */ };
  importRewrite: { [oldPath: string]: string /* new path */ };
}
