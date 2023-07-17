# 2. Use Storybook to Visualize Component States

**Date**: 2023-05-02

**Status**: proposed <!-- Proposed | Accepted | Rejected | Superceded -->

**Proposer**: Thelma Boamah

## 👀 Context and Problem Statement

We are working towards creating a USDR-wide component library to implement our [design system](https://www.notion.so/Grants-Program-Wiki-44d6252c85344eb3b0077a9eb4f0fc5c).  [Storybook](https://storybook.js.org/) is a popular open-source tool for building and documenting component libraries.

### About Storybook

- What’s a story?

    A story captures the rendered state of a UI component. Developers write multiple stories per component that describe all the “interesting” states a component can support.

    [Component Story Format](https://storybook.js.org/docs/react/api/csf) is an [open standard](https://github.com/ComponentDriven/csf) for writing stories that Storybook uses.

    [How to write stories.](https://storybook.js.org/docs/react/writing-stories/introduction)

- Add-ons

    Add-ons are plugins that provide additional functionality to Storybook. They include features for [accessibility](https://storybook.js.org/addons/@storybook/addon-a11y/), testing different [viewport sizes](https://storybook.js.org/docs/react/essentials/viewport), and [interacting with components](https://storybook.js.org/docs/react/essentials/controls). Storybook comes with essential add-ons pre-installed and has a [catalog](https://storybook.js.org/addons) of additional add-ons.

## 🚗 Decision Drivers

### Why build a component library?

| Benefits | Challenges/Considerations |
| --- | --- |
| Speeds up development by providing pre-built components. | It’s an investment to create and maintain the library. |
| Ensures better consistency in design/ brand identity across products and reduces code duplication. | Requires coordination to avoid becoming a bottleneck for feature development. When components aren’t available or don’t provide necessary options, it can lead to devs building custom solutions that don’t get integrated back into the library. |
| Allows design changes to be applied in one place and propagated across projects. | Need to be mindful of breaking changes/backward compatibility when updating components |
| Evolves incrementally. | Need to determine and manage <https://storybook.js.org/tutorials/design-systems-for-developers/react/en/distribute/>, versioning, etc. Typically via the <https://docs.npmjs.com/creating-and-publishing-scoped-public-packages>.  |
| Using react-bootstrap as a base will speed up our library’s development.  | Need to determine what belongs in the component library vs in individual projects, i.e. only discrete components or whole features/pages. |
| Helps with onboarding by providing a source of truth for both product/design and engineering decisions and standards. | Communication/coordination between stakeholders for different projects. |

### Why build it with Storybook?

| Benefits | Challenges/Considerations |
| --- | --- |
| Has become the standard tool for building and documenting components in isolation. | Need to learn Storybook-specific APIs. |
| Builds a static project that’s easy to deploy and share with stakeholders (ex. <https://react.carbondesignsystem.com/>, code for <https://github.com/carbon-design-system/carbon/blob/main/packages/react/src/components/Button/Button.stories.js> stories). | Decoupling of components and project codebase adds some complexity. |
| Aids in design/dev collaboration by including add-ons such as the <https://storybook.js.org/addons/storybook-addon-designs>, which allows you to see Figma files alongside your component stories (<https://storybookjs.github.io/addon-designs/?path=/story/docs-figma-examples--embed-file>). There’s a <https://www.figma.com/community/plugin/1056265616080331589/Storybook-Connect> too but there’s some overhead to set it up (ex requires deploying using <https://www.chromatic.com/>).  |  |
| Components can be tested in isolation and separately from business logic. |  |

## 🤔 Considered options

These are some options to consider regarding how we could approach adopting Storybook.

| Strategy | Description | Pros | Cons |
| --- | --- | --- | --- |
| Starting with a standalone repo | To be able to use the component library across projects, we need a standalone repo. We can opt to start with that from the beginning. | - Available to all teams. | - Initial setup of hosting Storybook and creating an npm package for components. |
| Include Storybook in usdr-gost project | If initial new screens using the design system will be in the grants project, then we could start there with Storybook. | - No need for additional external dependency initially.

- Faster development compared to external package. | - Delays the eventual step of creating a standalone project.
 |
| Extract components to Storybook later | Begin building components for new screens within usdr-gost without Storybook. Extract those components to  | - Less upfront friction for developing new features. | - Cannot preview components separately from their use in a feature.
- More effort later to extract components and refactor project code to use the component library. |

## 💭 Proposal

TBD

## 🔄 Phases

All phases must be preceded by a migration plan for how we’ll move toward React.

- Phases for standalone repo

    A general strategy for adoption would be to start with upcoming screens, ex. [filters and saved searches](https://www.notion.so/Q2-2023-Search-Filter-Grants-ae92fbe0b92a480da46760dfce6d2f78). Those can be broken up into individual components, implemented with Storybook, and consumed in usdr-gost.

    Storybook can be added to any project, and we could opt to start using it in the grants project first. But since the intention is to create something USDR-wide, beginning with a standalone component library would avoid potential duplication or needing to relocate code from grants to a standalone library and refactor due to said relocation in the future.

    1. Phase 1: [when]  
        1. Create component library as a standalone project using Storybook and add-ons. Possibly set up Github project for tracking design system/component library tickets?
        2. Decide how/where to deploy Storybook. Step up CI/CD so updates are deployed automatically.
        3. Implement and test components from filters and saved searches features.
        4. Set up distribution through npm registry so it can be installed and used by projects.
        5. Iterate on components based on learnings from integrating them into grants project.
    2. Phase 2: [when]
        1. Continue to build out components based on screens.
        2. Start to implement components from the design system that are not yet attached to a specific screen.
        3. Share ownership of the component library with other project teams.
    3. Phase 3: [when]
        1. Component library is an ongoing effort so continue to iterate.
- Phases for including as part of usdr-gost repo

- Phases for incorporating Storybook later

## ℹ️ References / More Info

- React-storybook documentation: [https://storybook.js.org/docs/react/get-started/install](https://storybook.js.org/docs/react/get-started/install)
- Alternatives to Storybook - [https://blog.logrocket.com/alternatives-to-react-storybook/](https://blog.logrocket.com/alternatives-to-react-storybook/)
