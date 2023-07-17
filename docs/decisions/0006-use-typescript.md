# 0006 Use Typescript

Date: 05/07/2023
Status: Proposed  <!-- Proposed | Accepted | Rejected | Superceded -->

## Context and Problem Statement

Typescript has been widely and quickly adopted across the industry because of the benefits it gives applications. Typescript is a superset of javascript and provides type checking, reduces bugs, simplifies testings, and improves developers' onboarding. 

Since Typescript provides widespread benefits for applications, this ADR will focus on the best way to migrate to Typescript.

I will also focus on migrations solutions that allow for gradual TS adoption instead of a cut-over solution. Cut-over solutions may introduce bugs due to significant releases. 
Additionally, cut-over solutions would require substantial work and organization up-front to execute. 


## Decision Drivers

- Migration can be done iteratively 
- Should work with monorepos 
- Should work with both the frontend and backend codebases 
- Minimize PRs with large footprints


## Considered Options

1. Mixed JavaScript/TypeScript code bases
2. Adding type information to plain JavaScript files
3. Migrate all files to TS with `ts-ignore` comments and `any` on existing files and migrate them overtime 


## Decision Outcome

The best option for an initial migration is to use Option 2. In this way, we can work on migrating iteratively. That way, we can introduce ts without modifying our build process. We can introduce Typescript in the build process whenever the team sees fit. 

### Positive Consequences

This approach will allow us to break the work into several sections. The initial steps are ts enablement, migrating individual files, and enabling ts in the build step (which can be done in parallel). This way, we can ensure we can introduce changes in small PRs. 

### Negative Consequences 
The overall TS migration may take a significant amount of time if the team is not zealous in migrating individual files. 

---
### Option 1: Mixed JavaScript/TypeScript code bases

We can support a mix of JavaScript and TypeScript files for our code base and type-check with the compiler. We start with only JavaScript files and then migrate each file to TypeScript.

**Code changes required**

1. Create tsconfig.js 
2. Set `allowJs` in the ts compiler options
3. Modify build scripts to support ts  

**Benefits and drawbacks**
- Good - Allows JS and TS to coexist 
- Good - Enables TS and its benefits
- Bad - Introduces both the build step change and ts enablement in the same PR. That could have a large impact if not rolled out correctly. 

---
### Option 2: Use Typescript for type checking but not as a compiler

We can keep our current Javascript build process and our JavaScript-only code base. We use TypeScript as a type checker (not as a compiler). Once everything is correctly typed, we switch to TypeScript for building.

**Code changes required**
1. Run the ts compiler as a type checker by adding the --no-emit option 
2. Add `--allowJs` for allowing and copying JavaScript files
3. Add `-checkJs` for type-checking JavaScript files
4. Build the project with existing build infrastructure. 

**Benefits and drawbacks**
- Good - We are able to migrate files slowly. 
- Good - We support a mix of js and ts files. 
- Good - We seperate out the migration into 3 smaller steps.
- Bad - Since we setup the compiler last, we might miss out some of those benefits. 

---
### Option 3: Migrate JS file to typescript files, and use any and ts-ignore

We could migrate all javascript files to typscript files and just ignore type checking on all files, until each file is migrated. Use ts as type checker not as a tool for compiling. 

**Code changes required**
1. Migrate all the javascript files to typescript 
2. Add `@ts-ignore` to each file to avoid typechecking on non migrated files 
3. Remove `@ts-ignore` from files as they are fully migrated

**Benefits and drawbacks**
- Good - allows to migrate file one by one. 
- Bad - large inital commit as we convert js to ts files and add the git ignore 

### Additional consideration 

There are various codemods that make the migrations much easier and we can run them as needed. A great option is the Airbnb package called: [ts-migrate](https://github.com/airbnb/ts-migrate/tree/master/packages/ts-migrate-plugins. This package will reduce the manual process of common file changes required like renaming. 

## Resource Links

- [Strategies for migrating to TS](https://exploringjs.com/tackling-ts/ch_migrating-to-typescript.html) 
- [ts-migrate: A Tool for migrating to Typescript at Scale](https://medium.com/airbnb-engineering/ts-migrate-a-tool-for-migrating-to-typescript-at-scale-cd23bfeb5cc)
- [A simple guide for migrating from javascript to typescript](https://blog.logrocket.com/a-simple-guide-for-migrating-from-javascript-to-typescript/)
- [Understanding Typescript compilation process](https://medium.com/jspoint/typescript-compilation-the-typescript-compiler-4cb15f7244bc)