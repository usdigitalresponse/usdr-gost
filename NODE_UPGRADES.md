# How to upgrade Node.js

Last updated 3/20/2024

1. Update the version in several places:
  - `package.json`: `engines` field
  - `packages/client/package.json`: `engines` field
  - `packages/server/package.json`: `engines` field
  - `packages/e2e/package.json`: `engines` field
  - `.nvmrc` (`.node-version` symlinks to this)
  - `docker/Dockerfile`: `FROM node:version as app_base` and `FROM cypress/base:version as e2e`
  - `docker/production-api.Dockerfile`: `FROM node:version as app_base`

2. Run `yarn install` at the root of the project.

3. Fixup any breakages with yarn install, unit tests, manual testing of the app