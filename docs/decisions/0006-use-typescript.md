# 0006 Use Typescript

Date: 05/07/2023
Status: Proposed  <!-- Proposed | Accepted | Rejected | Superceded -->

## Context and Problem Statement

Typescript has been widely and quickly adopted across the industry because of the benefits it gives applications. Typescript is a superset of javascript and provides types checking which reduces the amount of bugs, simplifies testings, and improves onboarding for developers. 

Since Typescript provides so many widesread benefits for an applications, this ADR will focus primary on the best way to migrate to Typescript.

I also will be focusing on migrations solutions that allow for gradual ts adoption instead of a cutover solution. This is because cutover solutions may introduce bugs due to a large release and it would require substaintial work and organization up front to execute.  

## Decision Drivers

- Migration can done iteratively 
- Should work with monorepos 
- Should work with both the frontend and backend codebases 
- Minimize PRs with a large footprint


## Considered Options

1. Mixed JavaScript/TypeScript code bases
2. Adding type information to plain JavaScript files
3. Migrate all files to TS with ts-ignore comments and any on existing files and migrate them overtime 


## Decision Outcome

I believe the best option to do an intial migration is to use Option 2. In this way we can working on migrating in an iterative manner. That way we can introduce ts without modifying our build process. We could introduce the ts in the build process whenenver the team sees fit. 

### Positive Consequences

This approach will allow us to break the work into several sections. The initial steps are  ts enablement, migrating individual files, and in parallel  enabling ts in the build step. This way we can make sure that we can introduce changes in small PRs. 

### Negative Consequences 
If the team is not zealous migrating individual files, the overall TS migration may take a significant amount of time. 

---
### Option 1: Mixed JavaScript/TypeScript code bases

We can support a mix of JavaScript and TypeScript files for our code base and typescheck with the compiler. We start with only JavaScript files and then switch more and more files to TypeScript.

**Code changes required**

1. Create tsconfig.js 
2. Set `allowJs` in the ts compiler options
3. Modify build scripts to support ts  

**Benefits and drawbacks**
- Good - Allows JS and TS to coexist 
- Good - Enables TS and its benefits
- Bad - Introduces both the build step change and ts enablement in the same PR. That could have a large impact if not rolled out correctly. 

---
### Option 2: Use Typescript as a type check but not as a compiler

We can keep our current Javascript build process and our JavaScript-only code base. We use TypeScript as a type checker (not as a compiler). Once everything is correctly typed, we switch to TypeScript for building.

**Code changes required**
1. Run the ts compiler as a type checker by adding the --no-emit option 
2. Add `--allowJs` for allowing and copying JavaScript files
3. Add `-checkJs` for type-checking JavaScript files
4. Build the project with existing build infrastructure. 

**Benefits and drawbacks**
- Good, because [argument a]
- Good, because [argument b]
- Bad, because [argument c]

---
### Option 3: Migrate JS file to typescript, and use any and ts-ignore comments



**Code changes required**
1. Migrate all the javascript files to typescript 
2. Add `@ts-ignore` to each file to avoid typechecking on non migrated files 
3.  

**Benefits and drawbacks**
- Good, because [argument a]
- Good, because [argument b]
- Bad, because [argument c]

### Additional consideration 

There are various codemods that make the migrations much easier and we can run them as needed. A great option is the Airbnb package called: [ts-migrate](https://github.com/airbnb/ts-migrate/tree/master/packages/ts-migrate-plugins. This package will reduce the manual process of common file changes required like renaming. 

## Resource Links

- [Strategies for migrating to TS](https://exploringjs.com/tackling-ts/ch_migrating-to-typescript.html) 
- [ts-migrate: A Tool for migrating to Typescript at Scale](https://medium.com/airbnb-engineering/ts-migrate-a-tool-for-migrating-to-typescript-at-scale-cd23bfeb5cc)
- [A simple guide for migrating from javascript to typescript](https://blog.logrocket.com/a-simple-guide-for-migrating-from-javascript-to-typescript/)