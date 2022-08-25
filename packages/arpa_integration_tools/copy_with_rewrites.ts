import type { Config } from "./config";
import * as fs from "fs/promises";
import origGlob from "glob";
import mkdirp from "mkdirp";
import { promisify } from "util";
import * as path from "path";
import * as fse from "fs-extra";
import { list as listFiles, IFile as RRFile } from "recursive-readdir-async";
import { exec as origExec } from "child_process";

const exec = promisify(origExec);
const glob = promisify(origGlob);

interface CopyResult {
  createdFiles: { [newPath: string]: string /* old path */ };
}

async function doCopies(config: Config): Promise<CopyResult> {
  console.log("Starting copy step");
  const createdFiles: CopyResult["createdFiles"] = {};

  for (const [srcGlob, destPath] of Object.entries(config.copies)) {
    const globResult = await glob(srcGlob, {
      cwd: config.srcPath,
      dot: true,
      nosort: true,
      absolute: true,
      mark: true,
    });

    const destAbsolute = path.resolve(config.destPath, destPath);
    await mkdirp(destAbsolute);

    for (const srcAbsolute of globResult) {
      // The "mark" config option above causes glob to append a slash to directory matches
      const isDir = srcAbsolute.endsWith("/");
      const newPath = path.join(destAbsolute, path.basename(srcAbsolute));

      await fse.copy(srcAbsolute, newPath, { errorOnExist: true });

      if (!isDir) {
        createdFiles[newPath] = srcAbsolute;
        console.log("Copied", srcAbsolute, "to", newPath);
      } else {
        const allCreated: RRFile[] = await listFiles(newPath, {
          recursive: true,
          ignoreFolders: true,
        });
        for (const created of allCreated) {
          const createdPath = created.fullname;
          const fileRelativeToCreatedFolder = path.relative(newPath, createdPath);
          const srcFileAbsolute = path.resolve(srcAbsolute, fileRelativeToCreatedFolder);

          createdFiles[createdPath] = srcFileAbsolute;
          console.log("Copied", srcFileAbsolute, "to", createdPath);
        }
      }
    }
  }

  return { createdFiles };
}

async function addComments(createdFiles: CopyResult["createdFiles"], config: Config) {
  console.log("Adding comment to bottom of all copied .js files");

  const dateString = new Date().toISOString();
  const gitOutput = await exec("git rev-parse HEAD", { cwd: config.srcPath });
  const srcRepoGitHash = gitOutput.stdout.trim().substring(0, 10);

  for (const [newPath, oldPath] of Object.entries(createdFiles)) {
    if (!newPath.endsWith(".js")) {
      continue;
    }

    const oldRelative = path.relative(config.srcPath, oldPath);
    const msg = `\n// NOTE: This file was copied from ${oldRelative} (git @ ${srcRepoGitHash}) in the ${config.srcRepoName} repo on ${dateString}\n`;
    await fs.writeFile(newPath, msg, { flag: "a" });
  }
}

async function main() {
  // TODO(mbroussard): make this configurable; argv is weird with ts-node
  const configPath = "simple_test.json";
  const outputFile = `${configPath}-results.json`;

  console.log("Loading config:", configPath);
  const configContents = await fs.readFile(configPath, { encoding: "utf8" });
  const config: Config = JSON.parse(configContents);

  const copyResult = await doCopies(config);
  await addComments(copyResult.createdFiles, config);

  const results = { copyResult };
  await fs.writeFile(outputFile, JSON.stringify(results, undefined, 2), { flag: "w" });
}

if (require.main === module) {
  main();
}
