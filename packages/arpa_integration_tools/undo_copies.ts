import type { ResultsFile } from "./types";
import * as fse from "fs-extra";

function deleteAll(paths: string[]) {
  return paths.map((path) => fse.rm(path, { force: true, recursive: true }));
}

async function main() {
  const configPath = process.argv[2];
  if (!configPath) {
    console.error("Must pass config json as argv");
    return;
  }

  const resultsFile: ResultsFile = await fse.readJson(configPath);
  const createdFiles = Object.keys(resultsFile.copyResult.createdFiles);
  const createdDirectories = resultsFile.copyResult.createdDirectories;

  const fileDelResults = await Promise.allSettled(deleteAll(createdFiles));
  const dirDelResults = await Promise.allSettled(deleteAll(createdDirectories));

  const allDelResults = fileDelResults.concat(dirDelResults);

  for (const result of allDelResults) {
    if (result.status == "fulfilled") {
      continue;
    }

    console.error(result.reason);
  }

  console.log("Done");
}

if (require.main === module) {
  main();
}
