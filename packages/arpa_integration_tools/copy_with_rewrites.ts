import type { Config, CopyConfig } from "./config";
import * as fs from "fs/promises";
import origGlob from "glob";
import mkdirp from "mkdirp";
import { promisify } from "util";
import * as path from "path";
import * as fse from "fs-extra";
import { list as listFiles, IFile as RRFile } from "recursive-readdir-async";
import { exec as origExec } from "child_process";
import JSON5 from "json5";
import { rewriteImportsRaw } from "./rewrite_imports";

const exec = promisify(origExec);
const glob = promisify(origGlob);

interface CopyResult {
  createdFiles: { [newPath: string]: string /* old path */ };
  createdDirectories: string[];
}

async function doCopies(config: Config): Promise<CopyResult> {
  console.log("Starting copy step");
  const createdFiles: CopyResult["createdFiles"] = {};
  const createdDirectories: string[] = [];

  for (let [srcGlob, v] of Object.entries(config.copies)) {
    const copyConfig: CopyConfig =
      typeof v === "string" ? { dest: v as string } : (v as CopyConfig);
    const excludePatterns = (copyConfig.excludePatterns || []).map((p) => new RegExp(p));
    // This allows running the script while the config is unfinished
    if (copyConfig.dest == "" || copyConfig.dest == "???") {
      continue;
    }

    const globResult = await glob(srcGlob, {
      cwd: config.srcPath,
      dot: true,
      nosort: true,
      absolute: true,
      mark: true,
    });

    const destAbsolute = path.resolve(config.destPath, copyConfig.dest);
    const createdDir = await mkdirp(destAbsolute);
    if (createdDir) {
      createdDirectories.push(createdDir);
    }

    for (const srcAbsolute of globResult) {
      // The "mark" config option above causes glob to append a slash to directory matches
      const isDir = srcAbsolute.endsWith("/");
      const newPath = path.join(destAbsolute, path.basename(srcAbsolute));

      // Do the copy. This function recursively copies subdirectories and calls our filter callback
      // to exclude some files from copying.
      await fse.copy(srcAbsolute, newPath, {
        errorOnExist: true,
        filter: (copySrc, copyDest) => {
          const copySrcRelative = path.relative(config.srcPath, copySrc);
          return !excludePatterns.some((regex) => !!copySrcRelative.match(regex));
        },
      });

      if (!isDir) {
        createdFiles[newPath] = srcAbsolute;
        console.log("Copied", srcAbsolute, "to", newPath);
      } else {
        // If we copied a directory, traverse through it and log that we copied each individual file within.
        // This also feeds into the import-rewriting step.
        const allCreated: RRFile[] = await listFiles(newPath, {
          recursive: true,
        });
        for (const created of allCreated) {
          if (created.isDirectory) {
            createdDirectories.push(created.fullname);
            continue;
          }

          const createdPath = created.fullname;
          const fileRelativeToCreatedFolder = path.relative(newPath, createdPath);
          const srcFileAbsolute = path.resolve(srcAbsolute, fileRelativeToCreatedFolder);

          createdFiles[createdPath] = srcFileAbsolute;
          console.log("Copied", srcFileAbsolute, "to", createdPath);
        }
      }
    }
  }

  return { createdFiles, createdDirectories };
}

async function doFooterComments(createdFiles: CopyResult["createdFiles"], config: Config) {
  console.log("Adding comment to bottom of all copied .js files");

  const dateString = new Date().toISOString();
  const gitOutput = await exec("git rev-parse HEAD", { cwd: config.srcPath });
  const srcRepoGitHash = gitOutput.stdout.trim().substring(0, 10);

  for (const [newPath, oldPath] of Object.entries(createdFiles)) {
    const oldRelative = path.relative(config.srcPath, oldPath);
    const msg = `NOTE: This file was copied from ${oldRelative} (git @ ${srcRepoGitHash}) in the ${config.srcRepoName} repo on ${dateString}`;
    let comment = null;

    if (newPath.endsWith(".js")) {
      comment = `\n// ${msg}\n`;
    } else if (newPath.endsWith(".vue")) {
      comment = "\n<!-- ${msg} -->\n";
    }

    if (comment) {
      await fs.writeFile(newPath, comment, { flag: "a" });
    }
  }
}

function truncateExtension(filePath: string): string {
  const { dir, name } = path.parse(filePath);
  return path.join(dir, name);
}

interface ImportRewriteResult {
  brokenImports: {
    file: string;
    importReference: string;
  }[];
}

function exists(fpath: string): Promise<boolean> {
  return fs.access(fpath).then(
    () => true,
    () => false
  );
}

async function doImportRewrites(
  createdFiles: CopyResult["createdFiles"],
  config: Config
): Promise<ImportRewriteResult> {
  console.log("Rewriting relative imports");
  const brokenImports: ImportRewriteResult["brokenImports"] = [];

  // First, build a map of old module paths (without extension) to new module paths, combining the
  // list of files we copied and any explicit rewrites defined in the config file.
  const lookupMap: { [oldPath: string]: string /* new path */ } = {};
  for (const [newFile, oldFile] of Object.entries(createdFiles)) {
    if (!newFile.endsWith(".js")) {
      continue;
    }
    lookupMap[truncateExtension(oldFile)] = truncateExtension(newFile);
  }
  for (const [oldImport, newImport] of Object.entries(config.importRewrites)) {
    const oldAbsolute = path.resolve(config.srcPath, oldImport);
    const newAbsolute = path.resolve(config.destPath, newImport);
    lookupMap[oldAbsolute] = newAbsolute;
  }

  // Then, go through each of the newly copied JS files and parse them looking for imports to rewrite.
  for (const [newFile, oldFile] of Object.entries(createdFiles)) {
    if (!newFile.endsWith(".js")) {
      continue;
    }
    const { dir: oldFileDir } = path.parse(oldFile);
    const { dir: newFileDir } = path.parse(newFile);

    // This helper uses Babel parser to find all require() statements in the file and replace the
    // import with one that's returned from a callback.
    const unchangedImports: string[] = [];
    const rewrittenImports: string[] = [];
    await rewriteImportsRaw(newFile, (importPath) => {
      // If the the import is not relative to begin with (i.e. importing a node module), don't do
      // anything with it.
      if (!importPath.startsWith("./") && !importPath.startsWith("../")) {
        return importPath;
      }

      // Turn import path into an absolute path in the source directory (still no extension though)
      const oldAbsolute = path.resolve(oldFileDir, importPath);

      // Check in the lookup map for the new path of the referenced file
      if (!(oldAbsolute in lookupMap)) {
        unchangedImports.push(importPath);
        return importPath;
      }
      const rewrittenAbsolute = lookupMap[oldAbsolute];

      // Convert resulting absolute path back to relative import
      const rewrittenRelative = path.relative(newFileDir, rewrittenAbsolute);
      const prefix = rewrittenRelative.startsWith("../") ? "" : "./";
      const rewrittenWithPrefix = prefix + rewrittenRelative;
      rewrittenImports.push(rewrittenWithPrefix);

      return rewrittenWithPrefix;
    });

    // For any relative imports in the file that we did not transform (and even those we did, as a
    // sanity check), check if a file exists in the expected location. If not, log a warning.
    for (const importPath of unchangedImports) {
      if (await exists(path.resolve(newFileDir, importPath + ".js"))) {
        console.warn(
          "WARN: unchanged relative import",
          importPath,
          "not broken in",
          newFile,
          "-- was this expected?"
        );
        continue;
      }
      console.warn("WARN: broken import", importPath, "(unchanged) in", newFile);
      brokenImports.push({ file: newFile, importReference: importPath });
    }
    for (const importPath of rewrittenImports) {
      if (await exists(path.resolve(newFileDir, importPath + ".js"))) {
        continue;
      }
      console.warn("WARN: broken import", importPath, "(rewritten) in", newFile);
      brokenImports.push({ file: newFile, importReference: importPath });
    }
  }

  return { brokenImports };
}

export interface ResultsFile {
  copyResult: CopyResult;
  importRewriteResult: ImportRewriteResult;
}

async function main() {
  const configPath = process.argv[2];
  if (!configPath) {
    console.error("Must pass config json as argv");
    return;
  }
  const outputFile = configPath.replace(/\.json5?$/i, "-results.json");

  console.log("Loading config:", configPath);
  const configContents = await fs.readFile(configPath, { encoding: "utf8" });
  const config: Config = JSON5.parse(configContents);

  const copyResult = await doCopies(config);
  await doFooterComments(copyResult.createdFiles, config);
  const importRewriteResult = await doImportRewrites(copyResult.createdFiles, config);

  const results = { copyResult, importRewriteResult };
  await fs.writeFile(outputFile, JSON.stringify(results, undefined, 2), { flag: "w" });
}

if (require.main === module) {
  main();
}
