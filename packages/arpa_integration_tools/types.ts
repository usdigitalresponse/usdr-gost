export interface Config {
  // Path of the source repo where things will be copied from
  srcPath: string;
  // Name of the source repo (used in footer comment added to copied files)
  srcRepoName: string;
  // Path of the destination repo where things will be copied to
  destPath: string;
  // Describes which files should be copied where. The key is a glob pattern of
  // paths to grab, and the value is path where the file(s)/folder(s) should be copied
  // to, optionally with additional configuration (see CopyConfig).
  copies: { [oldPathGlob: string]: CopyConfig | string /* new path */ };
  // Map of file paths in the source repo that should be rewritten to different paths
  // in the destination repo. These should be relative to srcPath/destPath and have file
  // extensions.
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
