import * as path from "path";
import { parse } from "@babel/parser";
import type * as types from "@babel/types";
import traverse from "@babel/traverse";
import * as fs from "fs/promises";

export async function rewriteImportsRaw(
  filePath: string,
  rewriter: (path: string) => Promise<string>,
  warn = console.warn,
  dryRun = false
) {
  const fileContents = await fs.readFile(filePath, { encoding: "utf8" });
  let scriptStart = 0;
  let scriptEnd = fileContents.length;
  let inputCode = fileContents;
  let startLine = 1;
  let startColumn = 1;

  // Handle .vue files. Babel doesn't understand them, so extract just the JS portion
  if (filePath.endsWith(".vue")) {
    const matches = /<script>.*<\/script>/ms.exec(fileContents);
    if (!matches) {
      warn("Vue file with no script tag found; skipping import rewriting.", filePath);
      return;
    }

    scriptStart = matches.index + "<script>".length;
    scriptEnd = matches.index + matches[0].length - "</script>".length;
    inputCode = fileContents.substring(scriptStart, scriptEnd);

    const prefix = fileContents.substring(0, scriptStart).split("\n");
    startLine = prefix.length;
    startColumn = prefix[prefix.length - 1].length;
  }

  // Use Babel parser to identify StringLiteral elements corresponding to require() statements
  // NOTE: this only supports JS/TS, but not Vue SFC format. Those will have to have imports fixed
  // separately up manually if we change their directory structure (though might be grep-able because
  // they mostly use Vue's @-imports that are relative to src/)
  const ast = parse(inputCode, {
    sourceFilename: filePath,
    startLine,
    startColumn,
    // Required to support import statements
    sourceType: "module",
  });
  const toReplace: types.StringLiteral[] = [];
  traverse(ast, {
    CallExpression: (path, state) => {
      const callee = path.node.callee;
      if (callee.type != "Identifier" || callee.name != "require") {
        return;
      }

      const reqPathNode = path.node.arguments[0];
      if (reqPathNode.type != "StringLiteral") {
        warn("Encountered non-literal require at", path.node.loc);
        return;
      }

      toReplace.push(reqPathNode);
    },
    ImportDeclaration: (path, state) => {
      const sourceNode = path.node.source;
      if (sourceNode.type != "StringLiteral") {
        warn("Encountered non-literal import at", path.node.loc);
        return;
      }

      toReplace.push(sourceNode);
    },
  });

  // Generate output manually rather than with Babel's generator so that we preserve all formatting
  // in the rest of the file.
  // Assumption: AST nodes are in order of appearance in the file
  let outputCode = "";
  let cursor = 0;
  for (const astNode of toReplace) {
    const start = astNode.start!;
    const end = astNode.end!;
    if (cursor < start) {
      outputCode += inputCode.substring(cursor, start);
      cursor = start;
    }

    const oldPath = astNode.value;
    const newPath = await rewriter(oldPath);
    if (oldPath == newPath) {
      // Don't emit anything, next iteration will advance cursor and include the original import
      continue;
    }

    // Assumptions:
    //  - We want single quoted imports everywhere
    //  - Import paths don't contain anything that needs escaped
    const quotedNewPath = `'${newPath}'`;
    outputCode += quotedNewPath;
    cursor = end;
  }
  if (cursor < inputCode.length) {
    outputCode += inputCode.substring(cursor);
  }

  // Re-wrap code if we stripped out Vue stuff
  outputCode =
    fileContents.substring(0, scriptStart) + outputCode + fileContents.substring(scriptEnd);

  if (dryRun) {
    console.log(outputCode);
  } else {
    await fs.writeFile(filePath, outputCode, { flag: "w" });
  }
}

async function main() {
  // This is just a quick test with a file that contains both ./ and ../ imports
  await rewriteImportsRaw(
    "../server/__tests__/api/keywords.test.js",
    (old) => old + "ABC",
    console.warn,
    true /* dryRun */
  );
}

if (require.main === module) {
  main();
}
