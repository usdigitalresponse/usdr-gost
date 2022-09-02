import * as path from "path";
import { parse } from "@babel/parser";
import type { Config, CopyResult, ImportRewriteResult } from "./types";
import type * as types from "@babel/types";
import traverse from "@babel/traverse";
import * as fs from "fs/promises";
import { truncateExtension, exists } from "./util";

export async function mapImportPaths(
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

// Used for identifying "src" folder that Vue "@/" imports refer to
async function getSrcParentDirRelativePrefixForFile(fpath: string) {
  const origPath = fpath;
  let ret = "";
  let found = false;

  // Get absolute paths of all parent directories
  const parents = [];
  while (fpath != "/") {
    const p = path.dirname(fpath);
    parents.push(p);
    fpath = p;
  }

  for (const parent of parents) {
    // Is the parent directory itself a src folder?
    if (path.basename(parent) == "src") {
      found = true;
      break;
    }

    // Does the parent directory contain a src folder?
    // This check is to handle @/ imports in tests that are not themselves nested under src.
    // Assumption: src will be a sibling to some parent of the test file.
    if (await exists(path.join(parent, "src"))) {
      ret = `${ret}src/`;
      found = true;
      break;
    }

    ret = `../${ret}`;
  }

  if (!found) {
    // If we never broke out of this loop, we went all the way up to filesystem root
    // and didn't find a src folder
    throw new Error(`getSrcParentDirRelativeToPath got path ${origPath} not nested under src!`);
  }

  if (!ret.startsWith("../")) {
    ret = "./";
  }

  return ret;
}

export async function doImportRewrites(
  createdFiles: CopyResult["createdFiles"],
  config: Config
): Promise<ImportRewriteResult> {
  console.log("Rewriting relative imports");
  let brokenImports: ImportRewriteResult["brokenImports"] = [];

  const warnings: string[] = [];
  function warn(...args: any[]) {
    console.warn("WARN:", ...args);
    warnings.push(
      args.map((a) => (String(a) == "[object Object]" ? JSON.stringify(a) : String(a))).join(" ")
    );
  }

  // First, build a map of old module paths (without extension) to new module paths, combining the
  // list of files we copied and any explicit rewrites defined in the config file.
  const lookupMap: { [oldPath: string]: string /* new path */ } = {};
  for (const [newFile, oldFile] of Object.entries(createdFiles)) {
    lookupMap[truncateExtension(oldFile)] = truncateExtension(newFile);
  }
  for (const [oldImport, newImport] of Object.entries(config.importRewrites)) {
    const oldAbsolute = path.resolve(config.srcPath, oldImport);
    const newAbsolute = path.resolve(config.destPath, newImport);
    lookupMap[truncateExtension(oldAbsolute)] = truncateExtension(newAbsolute);
  }

  // Then, go through each of the newly copied JS files and parse them looking for imports to rewrite.
  for (const [newFile, oldFile] of Object.entries(createdFiles)) {
    if (!newFile.endsWith(".js") && !newFile.endsWith(".vue")) {
      continue;
    }
    const { dir: oldFileDir } = path.parse(oldFile);
    const { dir: newFileDir } = path.parse(newFile);

    // This helper uses Babel parser to find all require() statements in the file and replace the
    // import with one that's returned from a callback.
    const unchangedImports: string[] = [];
    const rewrittenImports: string[] = [];
    await mapImportPaths(
      newFile,
      async (importPath) => {
        // Some Vue components and tests use these wacky "@/" imports that basically mean
        // "relative to src folder".
        // See https://stackoverflow.com/a/42753045
        // To process these, we have to convert to regular relative imports. This means we will also
        // output these as regular relative imports (that's fine & should be equivalent).
        //
        // TODO: There are also a few of these in tests folder that will get rewritten by this to
        // have long strings of ../../../ -- is that desirable, or should we keep the "@/" imports
        // and fix up manually if needed?
        if (importPath.startsWith("@/")) {
          const srcSrcRelative = await getSrcParentDirRelativePrefixForFile(oldFile);
          importPath = importPath.replace("@/", srcSrcRelative);
        }

        // If the the import is not relative to begin with (i.e. importing a node module), don't do
        // anything with it.
        if (!importPath.startsWith("./") && !importPath.startsWith("../")) {
          return importPath;
        }

        // Some Vue imports contain an extension, but our lookup map omits extensions
        const { ext: importExt } = path.parse(importPath);
        importPath = truncateExtension(importPath);

        // Turn import path into an absolute path in the source directory (still no extension though)
        let oldAbsolute = path.resolve(oldFileDir, importPath);

        // Check in the lookup map for the new path of the referenced file
        if (!(oldAbsolute in lookupMap)) {
          // Some things import e.g. "./store/index.js" as "./store".
          // Don't try this if the original import had an extension on it.
          if (!importExt) {
            oldAbsolute = path.join(oldAbsolute, "index");
          }

          if (!(oldAbsolute in lookupMap)) {
            unchangedImports.push(importPath);
            return importPath;
          }
        }
        const rewrittenAbsolute = lookupMap[oldAbsolute];

        // Convert resulting absolute path back to relative import, re-adding extension if it
        // was present on the original import.
        const rewrittenRelative = path.relative(newFileDir, rewrittenAbsolute) + importExt;
        const prefix = rewrittenRelative.startsWith("../") ? "" : "./";
        const rewrittenWithPrefix = prefix + rewrittenRelative;
        rewrittenImports.push(rewrittenWithPrefix);

        return rewrittenWithPrefix;
      },
      warn
    ).catch((err) => {
      warn("Error from rewriteImportsRaw", newFile, err);
    });

    // Sanity check that all relative imports in the file actually have a file at the expected location.
    brokenImports = brokenImports.concat(
      await sanityCheckRewrittenImports(newFile, unchangedImports, rewrittenImports, warn)
    );
  }

  return { brokenImports, warnings };
}

async function sanityCheckRewrittenImports(
  newFile: string,
  unchangedImports: string[],
  rewrittenImports: string[],
  warn = console.warn
) {
  const brokenImports: ImportRewriteResult["brokenImports"] = [];
  const { dir: newFileDir } = path.parse(newFile);

  const allImports = [
    ...unchangedImports.map((importPath) => ({ importPath, rewritten: false })),
    ...rewrittenImports.map((importPath) => ({ importPath, rewritten: true })),
  ];

  // Empty string is in this list because imports that had extension specfied in code will
  // end up in rewrittenImports also with extension, then not be found if we try to append
  // a second extension to them.
  const extensions = ["", ".js", ".vue"];

  for (const { importPath, rewritten } of allImports) {
    let found = false;
    for (const ext of extensions) {
      if (await exists(path.resolve(newFileDir, importPath + ext))) {
        found = true;
        break;
      }
    }

    if (!found) {
      const kind = rewritten ? "rewritten" : "unchanged";
      warn("broken", kind, "import", importPath, "in", newFile);
      brokenImports.push({ file: newFile, importReference: importPath, kind });
    } else if (!rewritten) {
      warn(
        "unchanged relative import to non-copied file",
        importPath,
        "not broken in",
        newFile,
        "-- was this expected? May have unintentionally imported something from new repo with same name."
      );
    }
  }

  return brokenImports;
}

async function runTest() {
  // This is just a quick test with a file that contains both ./ and ../ imports
  await mapImportPaths(
    "../server/__tests__/api/keywords.test.js",
    (old) => Promise.resolve(old + "ABC"),
    console.warn,
    true /* dryRun */
  );
}

if (require.main === module) {
  runTest();
}
