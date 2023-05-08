# 0006 Use Typescript

Date: 05/07/2023
Status: Proposed  <!-- Proposed | Accepted | Rejected | Superceded -->

## Context and Problem Statement

Typescript has been widely adopted and easily adopted across the industry because of the benefits it gives applications. Typescript is a superset of javascript and provides types checking which reduces the amount of bugs, simplifies testings, and improves onboarding for developers. 

Since Typescript provides so many widesread benefits for an applications, this ADR will focus primary on the best way to migrate to Typescript.

 I also will be focusing on migrations solutions that allow for gradual ts adoption instead of a cutover solution. This is because cutover solutions may introduce bugs due to a large release and it would require substaintial work and organiztion up front to execute.  

## Decision Drivers <!-- optional -->

- Migration can done iteratively 
- Should work with monorepos 

## Considered Options

1. Mixed JavaScript/TypeScript code bases
2. Adding type information to plain JavaScript files
- [option 3]
- … <!-- numbers of options can vary -->

## Decision Outcome

Chosen option: "[option 1]", because [justification. e.g., only option, which meets k.o. criterion decision driver | which resolves force force | … | comes out best (see below)].

### Positive Consequences <!-- optional -->

- [e.g., improvement of quality attribute satisfaction, follow-up decisions required, …]
- …

### Negative Consequences <!-- optional -->

- [e.g., compromising quality attribute, follow-up decisions required, …]
- …

---
### Option 1: Mixed JavaScript/TypeScript code bases

**Overview**

We can support a mix of JavaScript and TypeScript files for our code base. We start with only JavaScript files and then switch more and more files to TypeScript.

**Code changes required**

1. Create tsconfig.js 
2. Set `allowJs` in the ts compiler options
3. Modify build scripts to support ts  

**Breakdown of benefits and drawbacks**
- Good, because [argument a]
- Good, because [argument b]
- Bad, because [argument c]
- … <!-- numbers of pros and cons can vary -->

---
### Option 2: Adding type information to plain JavaScript files

We can keep our current Javascript build process and our JavaScript-only code base. We add static type information via JSDoc comments and use TypeScript as a type checker (not as a compiler). Once everything is correctly typed, we switch to TypeScript for building.

[example | description | pointer to more information | …] <!-- optional -->

- Good, because [argument a]
- Good, because [argument b]
- Bad, because [argument c]
- … <!-- numbers of pros and cons can vary -->

### [option 3]

[example | description | pointer to more information | …] <!-- optional -->

- Good, because [argument a]
- Good, because [argument b]
- Bad, because [argument c]
- … <!-- numbers of pros and cons can vary -->

## Code Examples

[If relevant / it would help the discussion, please provide code examples here that would help in comparing the various options on the table.

A few possible options for doing this:

- A link to a gist or proof of concept repository
- A separate code block using [github code fencing](https://help.github.com/articles/creating-and-highlighting-code-blocks/)
- If necessary, you can add a new folder within the `docs/decisions` directory titled `000X-decision-name-files` and add necessary code files there.
Ideally use the same mechanism for storing all files related to a decision - the below examples are meant to show the full set of different options
]

### Option 1 Code Example <!-- optional -->

```javascript
console.log('Hello, World!');
```

### Option 2 Code Example <!-- optional -->

[Link to gist](www.example.com)

### Option 3 Code Example <!-- optional -->

[local link to file](000X-decision-name-files/example.js)

## Resource Links <!-- optional -->

- [Strategies for migrating to TS](https://exploringjs.com/tackling-ts/ch_migrating-to-typescript.html) 