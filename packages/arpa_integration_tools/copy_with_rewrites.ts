import type { Config } from "./config";
import * as fs from "fs/promises";
import globCb from "glob";
import mkdirp from "mkdirp";
import { promisify } from "util";
import * as path from "path";
import * as fse from "fs-extra";
import { list as listFiles } from "recursive-readdir-async";

const glob = promisify(globCb);

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
        const allCreated: string[] = await listFiles(newPath, {
          recursive: true,
          ignoreFolders: true,
        });
        for (const created of allCreated) {
          const relative = path.relative(destAbsolute, created);
          const oldPath = path.resolve(config.srcPath, relative);

          createdFiles[created] = oldPath;
          console.log("Copied", oldPath, "to", created);
        }
      }
    }
  }

  return { createdFiles };
}

async function main() {
  // TODO(mbroussard): make this configurable; argv is weird with ts-node
  const configPath = "simple_test.json";
  const outputFile = `${configPath}-results.json`;

  console.log("Loading config:", configPath);
  const configContents = await fs.readFile(configPath, { encoding: "utf8" });
  const config: Config = JSON.parse(configContents);

  const copyResult = await doCopies(config);

  const results = { copyResult };
  await fs.writeFile(outputFile, JSON.stringify(results, undefined, 2), { flag: "w" });
}

if (require.main === module) {
  main();
}
