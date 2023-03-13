# Workspaces

This repository is a monorepo that uses [Yarn workspaces](https://classic.yarnpkg.com/en/docs/workspaces/) to manage multiple packages.

## Project Structure

The project structure looks like this:

```sh
├── packages                                    # Yarn workspace
│   ├── client                                  # Vue App
│   └── server                                  # Node server
│       ├── migrations                          # db migrations
│       └── seeds                               # db seeds
│       └── knexfile                            # knex configuration
```

Each folder inside packages/ is considered a workspace. To see a list of all workspaces, run the following: `yarn workspaces info`.

## Yarn Workspaces

We use [Yarn Workspaces](https://classic.yarnpkg.com/en/docs/cli/workspaces) to manage a monorepo comprised of `client` and a `server` packages, contained within the `packages` folder. Workspaces let you run commands at the top level of the repo without having to `cd` into the respective repositories.

Simply start the command with `yarn workspace client` or `yarn workspace server` before the command you wish to run. You can also specify `yarn workspaces run` to run a given command against all workspaces within the repository. Note that when running long-running/polling processes, it's necessary to use [concurrently](https://www.npmjs.com/package/concurrently) or similar.

Example usages:

`yarn workspace client serve` - Run the `serve` script within `./packages/client/packages.json`

`yarn workspace server serve` - Run the `serve` script within `./packages/server/packages.json`

`yarn workspaces run serve` - Run the `serve` script within both `./packages/client/packages.json` and `./packages/server/packages.json`

## Adding dependencies

### To add dependencies to one workspace

`yarn workspace client add {modules}"` - where workspace_name is the name in package.json. Run `yarn workspaces info` to see a list of packages.

Example:

```sh
yarn workspace client add uuid --dev
```

Or, you can always `cd` to the directory within `packages` and run the command there, as in:

```sh
cd packages/client && yarn add {modules}
```

### Add dependencies to multiple packages

```sh
yarn workspaces add {modules}
```
