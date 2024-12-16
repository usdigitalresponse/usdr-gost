https://github.com/usdigitalresponse/usdr-gost/pull/3794# 0011. Use testing-library/vue

Date: 2024-12-11
Status: Proposed <!-- Proposed | Accepted | Rejected | Superceded -->

## Context and Problem Statement

Accessibility is a key aspect to development and testing-library supports testing from the user perspective using accessible selectors.  testing-library is also a widely used testing library that can make achieving test case coverage easier.

## Decision Drivers <!-- optional -->

- Ability to write tests from the user perspective keeping accesibility in mind
- Improve developer experience through better testing experience.  Tests written using testing-library are more readable and easier to maintain.
<!-- numbers of drivers can vary -->

## Considered Options

1. Do not make any changes to the testing libraries
1. Use vitest browser testing locators
1. Use testing-library/vue
 <!-- numbers of options can vary -->

## Decision Outcome

TBD

### Positive Consequences <!-- optional -->

- Tests better reflect the user experience
- Tests check for accessible names
- Provides a better developer experience

### Negative Consequences <!-- optional -->

- May require some ramp up time for devs who are not familiar with testing-library approach to testing.

## Pros and Cons of the Options <!-- optional -->

### Do not make any changes to the current test libraries and version

- Good, because no changes to current tooling
- Bad, because it is harder to test in a way that catches accessible names and achieve test case coverage <!-- numbers of pros and cons can vary -->

### Use vitest browser testing locators

[Vitest Browser Mode - locators documentation](https://main.vitest.dev/guide/browser/locators)

- Good, because it continues to rely on vitest which may be familiar to vue developers.
- Bad, because it is only available in browser testing mode and requires playwright to be installed.
- Bad, because it required an separate script from the current test script.
- Bad, because it generated separate coverage report which would need to be reconciled with the current test report to calculate total code coverage.
- Bad, because the browser mode is currently experimental.

### [Use testing-library/vue]

[Testing Library Vue documentation](https://testing-library.com/docs/vue-testing-library/intro/)

- Good, because it is widely used and well supported as part of the testing-library family.
- Good, tests are written in a way that is more readable and easier to maintain
- Good, because it is doesn't require any additional tooling
- Good, because developers with react experience can use the same testing library as they are familiar with.
- Bad, because it requires additional npm packages - testing-library/vue, @testing-library/jest-dom, @testing-library/user-event

## Code Examples

### Option 1  - No changes - Code Example <!-- optional -->

n/a

### Option 2 - vitest browser mode - Code Example <!-- optional -->

        const sendTreasuryReportButton = wrapper.get('#sendTreasuryReportButton');
        expect(sendTreasuryReportButton.text()).toContain('Send Treasury Report by Email');

### Option 3 - testing-library/vue - Code Example <!-- optional -->

        screen.getByRole('button', { name: /Send Treasury Report by Email/i });

## Links <!-- optional -->

[Link to PR #3794 - chore(gost): update vitest version and add testing-library for accessible queries](https://github.com/usdigitalresponse/usdr-gost/pull/3794)