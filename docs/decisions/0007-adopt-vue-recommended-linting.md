# 0007. Adopt vue/recommended linting

Date: 2024-02-26
Status: Accepted

## Context and Problem Statement

Our frontend code currently enforces the [essential](https://eslint.vuejs.org/rules/#priority-a-essential-error-prevention) 
set of linting rules from [`eslint-plugin-vue`](https://eslint.vuejs.org/). This minimal set of 
rules leaves a lot of code style up to individual authors and avoids enforcing a number of 
community best practices. For this codebase to better support new volunteers frequently 
onboarding while maintaining consistency and readability, we would benefit from adopting the full 
set of Vue community recommended linting rules 
([strongly recommended](https://eslint.vuejs.org/rules/#priority-b-strongly-recommended-improving-readability) 
and [recommended](https://eslint.vuejs.org/rules/#priority-c-recommended-potentially-dangerous-patterns)). 

## Decision Drivers <!-- optional -->

- **Consistency and readability**: Enforcing style choices keeps code more readable and maintainable.
- **Easy Onboarding**: By adopting and automating community standards, we make it easier for new 
  engineers to spin up and be productive quickly.
- **Security**: Some rules help us enforce security best practices (e.g., 
  [`vue/no-v-html`](https://eslint.vuejs.org/rules/no-v-html.html)).
- **Bug prevention**: Some rules help us avoid bugs before they happen (e.g., 
  [`vue/no-template-shadow`](https://eslint.vuejs.org/rules/no-template-shadow.html)).

## Considered Options

The relevant option space is really just which rules to adopt. The `eslint-plugin-vue` package 
organizes its rules into three groups (each being a superset of the previous): 

- [Priority A: Essential (Error Prevention)](https://eslint.vuejs.org/rules/#priority-a-essential-error-prevention) 
  — *our current ruleset*
- [Priority B: Strongly Recommended (Improving Readability)](https://eslint.vuejs.org/rules/#priority-b-strongly-recommended-improving-readability)
- [Priority C: Recommended (Potentially Dangerous Patterns)](https://eslint.vuejs.org/rules/#priority-c-recommended-potentially-dangerous-patterns) 
  — *proposed ruleset*

We could also override individual rules from these rulesets if we disagreed with them or they 
caused undue burden in development.

## Decision Outcome

This proposal is to adopt the full [recommended](https://eslint.vuejs.org/rules/#priority-c-recommended-potentially-dangerous-patterns) ruleset for linting across our frontend code. 

## Code Examples

In order to avoid a "pause the world" style single giant PR, we would introduce the linting rules 
incrementally. Examples of how this would work can be seen in: 

1. Code change to introduce eslint rule change – https://github.com/usdigitalresponse/usdr-gost/pull/2654
2. Example of burning down one file incrementally — https://github.com/usdigitalresponse/usdr-gost/pull/2655

The burndown work could easily be split into a number of "easy first issue" tickets and worked through over a couple weeks. 