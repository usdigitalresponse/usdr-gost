import type { Config, CopyConfig, CopyResult } from "./types";
import origGlob from "glob";
import mkdirp from "mkdirp";
import { promisify } from "util";
import * as path from "path";
import * as fse from "fs-extra";
import { list as listFiles, IFile as RRFile } from "recursive-readdir-async";

const glob = promisify(origGlob);

export async function doCopies(config: Config): Promise<CopyResult> {
  console.log("Starting copy step");
  const createdFiles: CopyResult["createdFiles"] = {};
  const createdDirectories: string[] = [];

  for (let [srcGlob, v] of Object.entries(config.copies)) {
    const copyConfig: CopyConfig =
      typeof v === "string" || !v ? { dest: v as string } : (v as CopyConfig);
    const excludePatterns = (copyConfig.excludePatterns || []).map((p) => new RegExp(p));
    // This allows running the script while the config is unfinished, or with entries listed for
    // readability that should not actually be copied
    if (!copyConfig.dest || copyConfig.dest == "???") {
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

      // Check exclude patterns on the glob result.
      // We need to do this here (in addition to the filter predicate below) because if the glob
      // result is a single file, the filter predicate will stop it from being copied, but it won't
      // stop us from adding to createdFiles further below.
      const srcRelative = path.relative(config.srcPath, srcAbsolute);
      if (excludePatterns.some((regex) => !!srcRelative.match(regex))) {
        continue;
      }

      // Do the copy. This function recursively copies subdirectories and calls our filter callback
      // to exclude some files from copying.
      await fse.copy(srcAbsolute, newPath, {
        errorOnExist: false,
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

        // listFiles won't include the copied directory itself
        createdDirectories.push(newPath);
      }
    }
  }

  return { createdFiles, createdDirectories };
}
