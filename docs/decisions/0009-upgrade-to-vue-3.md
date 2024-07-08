# 0009. Migrate to Vue 3

Date: 2024-06-11 \
Status: Proposed <!-- Proposed | Accepted | Rejected | Superceded -->

## Context and Problem Statement

Our current frontend stack is built on [Vue 2](https://v2.vuejs.org/), which reached 
[end of life at the end of 2023](https://v2.vuejs.org/eol/). To ensure we keep up with security 
updates and modern features, we should move to a well-supported framework. 

## Considered Options

There are a few obvious paths forward: 

1. Remain on [Vue 2](https://v2.vuejs.org/) — this is ~zero effort, but we will no longer receive
   security updates or new features (including ecosystem packages we rely on)
2. Upgrade to [Vue 3](https://vuejs.org/) — this will be lower effort, and there is a clearly 
   documented [migration path](https://v3-migration.vuejs.org/)
3. Migrate to [React](https://react.dev/) — this would be higher effort, but React is a more 
   popular, meaning a more robust ecosystem of tools around it and volunteers being more likely to
   come in with existing experience

### Remain on Vue 2

This is the option we've de-facto chosen, since Vue 2 has already passed its EOL date. However, this
path will get progressively more problematic the longer we follow it: 

- Security issues are more likely to crop up as time goes on
- Compatibility with the ecosystem will degrade (not being able to use modern libraries or browser
  functionality) will increase over time
- Attracting engineers to work on deprecated infrastructure will also get harder over time

This will not be tenable forever. There is no immediate forcing function for us to move off Vue 2, 
but it will be a heavier lift the longer we put it off.

### Upgrade to Vue 3

This is the default path forward, as migrating from v2 to v3 is a 
[well understood and supported process](https://v3-migration.vuejs.org/). Vue 3 includes a Vue 2 
compatibility utility that is able to mimic the majority of Vue 2 APIs, so the migration outline is:

1. Migrate away from unsupported APIs (very minimal)
2. Deploy the minimal switch from Vue 2 to 3 using the compatibility layer (pretty manageable single PR)
3. Start adopting Vue 3 in any new code
4. Burn down the list of warnings (indicating usage of Vue 2 APIs)
5. Once all Vue 2 APIs are unused, we can remove the compatibility layer

This migration path has a number of benefits: 

- The compatibility layer is minimal overhead and entirely acceptable to deploy into production, so
  we'll be on a modern, well-supported framework very quickly (after step 2 above, even before we've
  migrated all Vue 2 API usage)
- The warnings for Vue 2 API usage are very clear and easy to track, providing us a clear task list
  to modernize our usage

The initial migration to Vue 3 (up through step 2) is pretty low effort, putting us on a
well-supported, maintained framework in just a week or two. Fully removing our reliance on the Vue 2
compatibility layer will take a bit more effort, but the task list is clearly laid out and the
intermediate state of the code until the work is completed is not particularly awkward or burdensome.

### Migrate to React

This path was previously proposed and lightly scoped about a year ago, but was not ultimately 
undertaken. Some background reading: 

- [Decision 0003. Use React for Frontend Development](./0003-use-react-for-frontend-development.md)
- [WIP Document Plan for Migrating from Vue to React](https://www.notion.so/usdr/WIP-Document-Plan-for-Migrating-from-Vue-to-React-30fbcf3f9af443b0843aa77c469eea29)
- [[SPIKE] Document Plan for Migrating from Vue to React](https://github.com/usdigitalresponse/usdr-gost/issues/1204)
- [Tech Modernization](https://www.notion.so/usdr/Tech-Modernization-b0f8e3736ebc4e9a898dad2b4ca2f858)

The key benefits of adopting React all flow from its position as the most popular frontend framework
today: 

- The project is large, well-funded, and stable
- The ecosystem and tooling around React is robust
- Frontend engineers are most likely to have existing familiarity

That said, I think the original proposal significantly underestimated the effort and risks of a full
frontend framework migration. 

- A full migration from Vue to React would be a very large undertaking, requiring a rewrite of
  nearly every line of frontend code, and comes with some real execution risk
  - Instead of pausing everything for a month or more to do a full codebase rewrite, we'd likely opt 
    to migrate the codebase incrementally, which would then require maintaining Vue and React code
    side-by-side for months
  - This is the kind of migration that often loses steam unless we're very diligent to get to 100%, 
    and risks ending up with 90% React code and a stubborn 10% of leftover Vue code that keeps us
    from removing all the Vue infrastructure

If there is still a strong desire on the team to migrate to React, I would suggest that we do a
fuller scoping and planning exercise. We could get more precision on the overall effort, timeframe,
and process for a better comparison with Vue 3.

## Decision Outcome

Proposed option: Upgrade to Vue 3.

## Investigation of Vue 3 upgrade considerations

- Performance
  - Given that we'll likely be running the compat layer in production for a while (bootstrap-vue
    is tied to Vue 2 for now, so we need to either wait for them to release a Vue 3 compatible 
    version or migrate off Bootstrap), we wanted to confirm Vue 3 with the compat layer would not
    cause any meaningful performance degradation.
  - Overall, performance of the Vue 2 and Vue 3 setups are very comparable, and the compat layer 
    does not seem to add any prohibitive amount of slowdown to the site.
  - See my full 
    [investigation notes here](https://docs.google.com/document/d/1jsQxQLhQOM54O0T5oQNFQqrmML6ngNqKFCEmQP-GCnA).
- Deprecation warnings
  - The Vue 3 compat helper will emit deprecation warnings in the browser console for all usages
    of outdated Vue 2 syntax. We want to turn these into helpful signal instead of unhelpful chunder. 
  - Bootstrap-vue related warnings should be logged to DataDog but filtered out completely from the
    console. Upgrading or migrating off that library will be a larger long-term undertaking, and in 
    the meantime the warnings are not helpful. 
  - Other deprecation warnings should be logged to DataDog to allow us to build a punch list of
    existing deprecated syntax usage. Once we have that, we can start throwing errors for new usages
    to ensure we're not introducing new deprecated syntax; and we can ticket up the punch list to
    upgrade historical usages of deprecated syntax. 
  - A quick proof of concept doing this by intercepting `console.warn` can be seen here:
    https://github.com/usdigitalresponse/usdr-gost/pull/3190/commits/58a6e5aca02a0fd89439873e2a8382f43532c6fa

## Code Examples

Proof of concept PR: https://github.com/usdigitalresponse/usdr-gost/pull/3190