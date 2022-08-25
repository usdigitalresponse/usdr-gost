import * as path from "path";
import { parse } from "@babel/parser";
import type * as types from "@babel/types";
import traverse from "@babel/traverse";
import * as fs from "fs/promises";

export async function rewriteImportsRaw(
  filePath: string,
  rewriter: (path: string) => string,
  dryRun = false
) {
  const inputCode = await fs.readFile(filePath, { encoding: "utf8" });

  // Use Babel parser to identify StringLiteral elements corresponding to require() statements
  // NOTE: this only supports JS/TS, but not Vue SFC format. Those will have to have imports fixed
  // separately up manually if we change their directory structure (though might be grep-able because
  // they mostly use Vue's @-imports that are relative to src/)
  const ast = parse(inputCode);
  const toReplace: types.StringLiteral[] = [];
  traverse(ast, {
    CallExpression: (path, state) => {
      const callee = path.node.callee;
      if (callee.type != "Identifier" || callee.name != "require") {
        return;
      }

      const reqPathNode = path.node.arguments[0];
      if (reqPathNode.type != "StringLiteral") {
        console.warn("Encountered non-literal require at", path.node.loc);
        return;
      }

      toReplace.push(reqPathNode);
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
    const newPath = rewriter(oldPath);
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
    true /* dryRun */
  );
}

if (require.main === module) {
  main();
}
