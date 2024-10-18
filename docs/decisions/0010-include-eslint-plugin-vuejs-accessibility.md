# 0010 Use eslint-plugin-vuejs-accessibility 

Date: 2024-10-13 \
Status: Proposed <!-- Proposed | Accepted | Rejected | Superceded -->

## Context and Problem Statement

Accessibility is a crucial aspect of web development, and it is essential to ensure that our Vue.js applications are accessible to all users.   [eslint-plugin-vuejs-accessibility](https://github.com/vue-a11y/eslint-plugin-vuejs-accessibility) is a static checking tool that helps us identify accessibility issues in our Vue.js code.

## Decision Drivers <!-- optional -->

- We want to ensure that our Vue.js applications are accessible to all users.
<!-- numbers of drivers can vary -->

## Considered Options

- Do not include an eslint-plugin for accessibility
- [eslint-plugin-vuejs-accessibility](https://www.npmjs.com/package/eslint-plugin-vuejs-accessibility) 
- [eslint-plugin-vue-a11y](https://www.npmjs.com/package/eslint-plugin-vue-a11y) 
<!-- numbers of options can vary -->

## Decision Outcome

TBD

<!-- Chosen option: "[option 1]", because [justification. e.g., only option, which meets k.o. criterion decision driver | which resolves force force | … | comes out best (see below)]. -->

### Positive Consequences <!-- optional -->

- Catching the accessibility issues in our Vue.js applications before they are deployed to production.
- Helping developers to write more accessible Vue.js applications.
- Reducing future remediation costs.

### Negative Consequences <!-- optional -->

- Some devs may not know how to fix accessibility issues in Vue.js applications, and this may cause some friction in development or result in a number of rules being disabled.

## Pros and Cons of the Options <!-- optional -->

### Do not include an eslint-plugin for accessibility

- Good, because no changes 
- Bad, because we will miss out on catching accessibility issues in our Vue.js applications before they are deployed to production.
<!-- numbers of pros and cons can vary -->

### eslint-plugin-vuejs-accessibility

- [NPM package - eslint-plugin-vuejs-accessibility](https://www.npmjs.com/package/eslint-plugin-vuejs-accessibility) 
  - [List of rules](https://vue-a11y.github.io/eslint-plugin-vuejs-accessibility/rule-overview/)
  - [Overview of the Vue A11y project](https://vue-a11y.com/project/#introduction)
  - [Releases](https://github.com/vue-a11y/eslint-plugin-vuejs-accessibility/releases)

- Good, because it is being actively maintained and has 231K weekly downloads.
- Good, because we would catch accessibility issues in our Vue.js applications before they are deployed to production.
<!-- numbers of pros and cons can vary -->

### eslint-plugin-vue-a11y

[NPM package - eslint-plugin-vue-a11y](https://www.npmjs.com/package/eslint-plugin-vue-a11y)  <!-- optional -->

- Bad, because it is not being actively maintained - was last published 5 years ago and only has 3k weekly downloads.
- Good, because we would catch accessibility issues in our Vue.js applications before they are deployed to production.
<!-- numbers of pros and cons can vary -->

## Code Examples

### Option 1 Code Example <!-- optional -->

n/a - no changes from current setup

### Option 2 Code Example <!-- optional -->

[Changes are in this PR with the Decision Record - #3634](https://github.com/usdigitalresponse/usdr-gost/pull/3634/files)

I can separate out the changes into separate PR if needed.

### Option 3 Code Example <!-- optional -->

n/a - not recommended

## Links <!-- optional -->

[NPM package - eslint-plugin-vuejs-accessibility](https://www.npmjs.com/package/eslint-plugin-vuejs-accessibility) 
- [List of rules](https://vue-a11y.github.io/eslint-plugin-vuejs-accessibility/rule-overview/)
- [Overview of the Vue A11y project](https://vue-a11y.com/project/#introduction)
- [Releases](https://github.com/vue-a11y/eslint-plugin-vuejs-accessibility/releases)

<!-- numbers of links can vary -->
