# 0008. Migrate to Vite

Date: 2024-04-24
Status: Proposed <!-- Proposed | Accepted | Rejected | Superceded -->

## Context and Problem Statement

We currently use the [Vue CLI Service](https://cli.vuejs.org/guide/cli-service.html) (which uses 
[Webpack](https://webpack.js.org/) under the hood) for our client code dev server and production 
bundling. However, we're running up against limitations in this setup: 

1. Vue CLI is [in maintenance mode](https://cli.vuejs.org/)
2. A [Vue 3 migration](https://v3-migration.vuejs.org/) will likely go a bit smoother if we've first
   migrated to [Vite](https://vitejs.dev/)
   - Vite is the 
     [recommended Vue 3 build setup](https://vuejs.org/guide/scaling-up/tooling.html#project-scaffolding) 
     unless you need specific webpack-only features
3. A number of developer experience features are more difficult to achieve in our current setup
   - Vite's dev server has [much faster](https://kinsta.com/blog/vite-vs-webpack/#cold-start-speed) 
     cold starts and updates
   - Instant [hot module replacement](https://vitejs.dev/guide/features.html#hot-module-replacement) 
     enables new dev workflows, like side-by-side code and browser windows (HMR can also be enabled 
     in Webpack, but with a 
     [plugin and additional configuration](https://webpack.js.org/concepts/hot-module-replacement/))
   - Vite [supports TypeScript](https://vitejs.dev/guide/features.html#typescript) (which we have 
     [proposed adopting](./0006-use-typescript.md)) out of the box, where a Webpack-based setup 
     would take [a bit more configuration](https://cli.vuejs.org/core-plugins/typescript.html)
   - [Vite's popularity](https://2022.stateofjs.com/en-US/libraries/build-tools/) is growing and 
     developer satisfaction is excellent compared to webpack

## Considered Options

- Status quo: Remain on Vue CLI
- Migrate to Vite
- Migrate to another build tool (Webpack sans Vue CLI, WMR, @web/dev-server, snowpack, etc.)
  - These are not compelling options, so are not fully explored here

## Decision Outcome

Chosen option: Migrate to Vite. 

The migration effort is manageable, and the benefits of a well-maintained tool and improved dev 
experience make the switch worthwhile. 

### Positive Consequences <!-- optional -->

- Vite is well-maintained (vs. Vue CLI in maintenance mode)
- Developer experience is improved
- Vue 3 and TypeScript migrations are eased

### Negative Consequences <!-- optional -->

- Moderate migration effort (estimated ~1 week of part-time volunteer eng)
- Introduction of issues (any infra migration has the potential to introduce bugs)

## Code Examples

A [proof of concept PR](https://github.com/usdigitalresponse/usdr-gost/pull/2965) whose description 
lays out more of the step-by-step migration path is available for review. 

## Links <!-- optional -->

Background reading and comparisons
- https://kinsta.com/blog/vite-vs-webpack/
- https://blog.replit.com/vite
- https://betterprogramming.pub/our-journey-with-vite-and-why-we-turned-back-to-webpack-b9a84ba7a223
- https://2022.stateofjs.com/en-US/libraries/build-tools/
