import * as fs from "fs/promises";
import * as path from "path";
import type { CopyResult, Config } from "./types";
import { promisify } from "util";
import { exec as origExec } from "child_process";

const exec = promisify(origExec);

export async function doFooterComments(createdFiles: CopyResult["createdFiles"], config: Config) {
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
      comment = `\n<!-- ${msg} -->\n`;
    }

    if (comment) {
      await fs.writeFile(newPath, comment, { flag: "a" });
    }
  }
}
