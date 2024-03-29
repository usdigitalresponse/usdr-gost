# Updating Output Templates

This document describes the process for updating the output templates used by the ARPA Reporter application. For more context, see the [Updating Templates](./updating-templates.md) document.

## Context

The ARPA Reporter application generates a number of output files that are sent to the Treasury. These files are generated by the application based on the data that users enter into the input template spreadsheets (which we create), but the format of the output files is determined by the Treasury.

## Step 1: Update the Output Template Spreadsheet

Obtain a new copy of the desired output template file, and store it in the [../../packages/server/src/arpa_reporter/data/treasury](./packages/server/src/arpa_reporter/data/treasury) directory.

Typically we will receive a new version of this spreadsheet direct from the treasury.

## Step 2: Run the Script

Run the [parseOutputTemplates.mjs](src/scripts/parseOutputTemplates.mjs) script to generate a new `outputTemplates.json` file that represents the requirements for the output template files.

To run this script, you can use the following command from within the `./packages/server` directory:

```bash
yarn run parse-output-templates
```

or from the top-level directory:

```bash
yarn workspace server run parse-output-templates
```

### Debug the Script

To debug the script, if you're using VSCode, you can run the script by using the `Parse Output Templates` configuration. You can then set necessary breakpoints in `parseOutputTemplates.mjs` and step through the code.
