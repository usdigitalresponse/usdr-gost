export interface Config {
  srcPath: string;
  srcRepoName: string;
  destPath: string;
  copies: { [oldPathGlob: string]: CopyConfig | string /* new path */ };
  importRewrites: { [oldPath: string]: string /* new path */ };
}

export interface CopyConfig {
  // destination folder where the specified file/folder should be copied into
  dest: string;

  // regex (not glob) patterns to exclude (compared against the path relative to srcPath)
  excludePatterns?: string[];
}

export interface ImportRewriteResult {
  brokenImports: {
    file: string;
    importReference: string;
  }[];
  warnings: string[];
}

export interface CopyResult {
  createdFiles: { [newPath: string]: string /* old path */ };
  createdDirectories: string[];
}

export interface ResultsFile {
  copyResult: CopyResult;
  importRewriteResult: ImportRewriteResult;
}
