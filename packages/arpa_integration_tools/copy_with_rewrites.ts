import type { Config, ResultsFile } from "./types";
import * as fs from "fs/promises";
import JSON5 from "json5";

import { doCopies } from "./copier";
import { doFooterComments } from "./footer_comments";
import { doImportRewrites } from "./rewrite_imports";

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

  const results: ResultsFile = { copyResult, importRewriteResult };
  await fs.writeFile(outputFile, JSON.stringify(results, undefined, 2), { flag: "w" });
}

if (require.main === module) {
  main();
}
