# CARES Grant Opportunities

# Setup

To setup your workspace run the following commands at the root of the project

```
npm i yarn@^1.22.4 -g
yarn run setup
```

The scripts will install yarn and download npm dependencies for all yarn workspaces.

# Project structure

```
├── migrations                                  # DB migations
├── src                                         # Yarn workspace
│   ├── client                                  # Vue App
│   └── server                                  # Node servr
```

Each folder inside src/ considered a workspace. To see a list of all worskpaces, run the following

`yarn workspaces info`

## Yarn Workspaces

Workspaces optimizes our repo by hoisting all of our separate node_modules/ to the root level meaning that a single yarn install command installs the NPM modules for all services

https://classic.yarnpkg.com/en/docs/workspaces/

## Lerna

Lerna helps us manage our packages, publish them, and keeps track of the dependencies between them. For example, it is used to run linting, deploy, and test scripts for each package from the root of the project.

Example usages

`npx lerna bootstrap` - recursive yarn install

`npx lerna run --scope server --stream start`

## Adding dependencies

### To add dependencies to one workspace

`npx lerna add {modules} --scope="{workspace_name}"` - where workspace_name is the name in package.json. Run `yarn workspaces info` to see a list of packages

    Example `npx lerna add uuid --scope="server" --dev`

Or you can run yarn inside the workspace

`yarn add {modules}`

### Add dependencies to multiple packages

`npx lerna add {modules}`

NOTE: yarn complains about incompatibility of some node modules with our node version (10.14). When using yarn, pass `--ignore-engines` when doing `yarn add/remove`. I have not been able to pass this argument when running `npx lerna add..`. After running lerna do a `yarn run bootstrap` at the root of the project to get your dependency correctly installed.

## Linting

### VSCode

Install the eslint plugin https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint

After that you should be able to see eslint prompts in js files

For linting on auto save: 
- Go to VSCode settings
  - Shift + Command + P
  - Search for settings
  - Select "Open Settings (JSON)"
- Paste the following snippet
```
"editor.formatOnSaveMode": "modifications",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
}
```

Note: Before Pasting check if there are any conflicting settings regarding esling or formatOnSave

Sharing my complete VSCode Setting
```
{
  "terminal.integrated.shell.osx": "/bin/zsh",
  "azureFunctions.showProjectWarning": false,
  "window.zoomLevel": 0,
  "diffEditor.ignoreTrimWhitespace": false,
  "azureFunctions.showCoreToolsWarning": false,
  "editor.columnSelection": false,
  "editor.find.cursorMoveOnType": true,
  "editor.formatOnSaveMode": "modifications",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

### IntelliJ

After installing depedencies, IntelliJ should start using eslint automatically:

> By default, IntelliJ IDEA marks the detected errors and warnings based on the severity levels from the ESLint configuration
https://www.jetbrains.com/help/idea/eslint.html#ws_js_linters_eslint_install