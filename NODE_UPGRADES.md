# How to upgrade Node.js

Last updated 8/22/2022

1. Update the version in several places:
  - `package.json`: `engines` field
  - `packages/client/package.json`: `engines` field
  - `packages/server/package.json`: `engines` field
  - `.nvmrc` (`.node-version` symlinks to this)
  - `.github/workflows/ci.yaml`: `node-version` field under `Install Node.js` build step

2. `npx lerna bootstrap` to rerun `yarn install` in both packages

3. Fixup any breakages with yarn install, unit tests, manual testing of the app