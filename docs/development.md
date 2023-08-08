
# Development

- [Development](#development)
  - [Workspaces](#workspaces)
  - [Running Code](#running-code)
    - [Docker](#docker)
    - [Local](#local)
  - [Linting](#linting)
    - [VSCode](#vscode)
    - [IntelliJ](#intellij)
  - [Debugging](#debugging)
    - [Chrome](#chrome)
  - [Website Feature Flags](#website-feature-flags)

As mentioned in the [Getting Started](../docs/getting-started.md) guide, there are two ways to set up this repository for development:

- Using Docker
- Using a local environment

The Docker-based method is generally preferred.

That said, instructions for running the app for development purposes are different depending on which method you choose.

## Workspaces

We make use of yarn workspaces in this project, read more [here](./workspaces.md) about how to set up and work with them.

## Running Code

### Docker

See [here](../docker/README.md) for more information about commands to use when developing locally with docker.

### Local

1. Run Client (Terminal 1)

   Now you should be able to serve the frontend.

   ***Ensure you are using the correct node version and are in the project root directory***

   ```sh
   yarn start:client
   ```

1. Run Server (Terminal 2)

   Now you should be able to serve the backend.

   **NOTE:** update `WEBSITE_DOMAIN` in `.env` to your client endpoint from Step 6 else When you get the login email link, change the redirected path from `localhost:8000/api/sessions/...` to your client_url e.g `localhost:8080/api/sessions/`

   ***Ensure you are using the correct node version and are in the project root directory***

   ```sh
   yarn start:server
   ```

   **NOTE:** if error references AWS (see screenshot below) then run `> unset AWS_ACCESS_KEY_ID`. The application will try to use AWS Simple Email Service (SES) if `AWS_ACCESS_KEY_ID` is found as an env var.

   ![AWS SES Error](./img/error-aws-ses.png)

1. Visit `client_url/login` (e.g <http://localhost:8080/#/login>) and login w/ user `grant-admin@usdigitalresponse.org`.

   **NOTE:** if you only see a blank screen then ensure you've set up the `packages/client/.env`

   **NOTE:** if you get `Error: Invalid login: 534-5.7.9 Application-specific password required.` then you'll need to set an App Password (<https://myaccount.google.com/apppasswords>) (See Step 4)

## Linting

### VSCode

Open the repository using the workspace file `usdr-gost.code-workspace`. You will be prompted tp install recommended VSCode plugins located in `.vscode/extensions.json` for Vue and Eslint support.

To enable linting on save, a settings section has been included in the workspace which sets the appropriate linting options.

### IntelliJ

After installing depedencies, IntelliJ should start using eslint automatically:

> By default, IntelliJ IDEA marks the detected errors and warnings based on the severity levels from the ESLint configuration
> <https://www.jetbrains.com/help/idea/eslint.html#ws_js_linters_eslint_install>

## Debugging

### Chrome

Install Vue Dev Tools to help with debugging: <https://chrome.google.com/webstore/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd?hl=en> .

See also:

- [How to set up client debugging using Google Chrome browser](https://github.com/usdigitalresponse/usdr-gost/wiki/How-to-set-up-client-debugging-using-Google-Chrome-browser)
- [How to set up server debugging using Google Chrome browser](https://github.com/usdigitalresponse/usdr-gost/wiki/How-to-set-up-server-debugging-using-Google-Chrome-browser)

## Website Feature Flags <a name="website-feature-flags"></a>

We use [feature flags (or "feature toggles")](https://en.wikipedia.org/wiki/Feature_toggle) in order
to independently control whether certain client-side features are active in development, staging,
and production environments. Feature flags are read from the `window.APP_CONFIG.featureFlags`
object and as such, may be modified dynamically by the developer console in your browser.

A few things to keep in mind about feature flags:

1. Most feature flags will simply have a boolean value that toggles a new feature or behavior
on (when `true`) or off (when `false`).
2. Feature flags should generally reference new behavior rather than old/existing behaviors.
For example, a feature flag called `useNewLayout` is preferable to one called `useLegacyLayout`.
3. For clarity, feature flags should use affirmative names. For example, a feature flag called
`newLayoutEnabled` is preferable to one called `newLayoutDisabled`. This helps foster consistent
evaluation processes, where `true` is treated as "active" and `false` is treated as "inactive",
and promotes a general practice of treating feature flags as inactive-by-default.

### During Development

In development environments, the `window.APP_CONFIG.featureFlags` object is defined within
the `packages/client/public/deploy-config.js` file. You may modify this file to add, remove,
or change the value of any feature flag that pertains to your work. In general, all feature
flags that are currently used in Staging and/or Production environments should be defined in
this file so that other contributors can easily find and reference them. Use your judgement
(and/or discuss with the team!) when determining an appropriate value for a feature flag
when committing changes to this file.

It is important to note that the git-tracked `packages/client/public/deploy-config.js` file
is excluded from non-development website builds that are deployed to Staging and Production
environments, so any changes made to this file will **not** be represented in a deployment.

### Deploying Feature Flags

In non-development environments (particularly Staging and Production), feature flags are configured
in Terraform, which is responsible for populating and deploying `deploy-config.js` to each
target environment. In order to configure a feature flag for non-development environments,
update the `website_feature_flags` input variable defined in the `.tfvars` file that pertains
to each environment that you want to configure. As a general best practice, feature flags
should be represented in each of the `.tfvars` files, although the respective value for each
feature flag will often be different.

Normally, a feature flag is set to an "inactive" value that is representative of the normal/default
behavior (i.e. where the feature does not currently exist) in `terraform/prod.tfvars` until it has
been approved as ready for Production. By contrast, a feature that should be available in our
for colllaborative QA activities in our Staging environment should be set to an "active" value
that enables the new behavior in `staging.tfvars`. Do note that features which are in a highly
unstable phase of development or would otherwise be generally disruptive to Staging environment
activities should be set to an inactive value.

**If you are unsure of what constitutes an appropriate value for a feature flag in any environment,
reach out to the team for discussion!**

#### Deploying to Production

Code that has been developed around a feature flag should always be initially deployed to Production
with the feature flag in-place, initially in a disabled/inactive state. Once the feature is ready
to be exposed to users in Production (meaning it has been approved by the team), configure its
"active" value in `terraform/prod.tfvars` – the code responsible for gating behaviors based on
the feature flag should remain unmodified when the feature is first released, which allows it
to be more easily deactivated if a problem is identified.

### Using Feature Flags in Code

Regardless of the configured value of a particular feature flag, the code that evaluates a feature
flag's value is ultimately responsible for the effective behavior. Take care to observe the
following guidelines when implementing code that makes use of feature flags:

1. Always evaluate a feature flag strictly, and always use the strict equality (`===`) operator
when comparing to another value – do not use "truthy"/"falsey" evaluations.
2. Treat feature flags as inactive-by-default. In other words, code that expects a boolean
feature flag should consider its value as `false` if the feature flag is `undefined`, `null`,
a non-boolean value, or any value other than `true`.
3. Where reasonable, avoid caching or otherwise persisting behaviors informed by a feature
flag's value beyond the immediate validation. This practice helps keep feature flag behaviors
obvious, avoids developer confusion, and allows dynamic modification of flag values in a browser
development console during testing.
4. Always define "getter" functions for feature flags via the library defined in the
`packages/client/src/helpers/featureFlags` directory, and avoid directly accessing the
`window.APP_CONFIG.featureFlags` object elsewhere.
5. Treat the `window.APP_CONFIG.featureFlags` object as read-only; **never** assign a value
to this object or any of its properties outside of `deploy-config.js`, as doing so creates
unpredictable behavior.

#### Reading Feature Flags

Whenever you start using a new feature flag, define a helper function used to access and evaluate
the flag in `packages/client/src/helpers/featureFlags/index.js`. Generally these functions will
be fairly simple, but they should make sure to guard against errors and other unexpected behaviors
in cases where a feature flag is not defined or has an unexpected value (see the previous guidelines
for more information). Call this new function elsewhere in order to retrieve the state of
the feature flag throughout the rest of the `packages/client` codebase.

### Removing Feature Flags

Feature flags are normally meant to be temporary, and used when a feature or one of its behaviors
is not completely ready for users in a Production environment, *or* when a feature that was
developed with a feature flag is first being deployed. Eventually, once the feature is deemed
stable and more or less permanent, it should be removed.

To safely remove a feature flag, follow these steps:
1. Identify calls to its corresponding helper function defined in
`packages/client/src/helpers/featureFlags/index.js`.
2. Remove those calls, taking care to update the calling code so that the previously-conditional
behaviors are now static and consistently treat the feature as active. Once you have updated
all references to the helper function, remove it from
`packages/client/src/helpers/featureFlags/index.js`.
3. Remove the feature flag definition from `packages/client/public/deploy-config.js`
4. Test in your development environment to ensure that the feature is intact. When testing,
watch for console errors (e.g. `ReferenceError`) to ensure that no calls to the now-undefined
function still remain.
5. Remove the feature flag definition from the `website_feature_flags` Terraform input variable
from all `.tfvars` files in the `terraform` directory.
