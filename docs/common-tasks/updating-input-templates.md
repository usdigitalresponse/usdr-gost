# Updating Input Templates

This document describes the process for updating the input templates used by the ARPA Reporter application. For more context, see the [Updating Templates](./updating-templates.md) document.

## Step 1: Store the Input Template Spreadsheet

Updates to input templates begin with changes to the spreadsheets that we use to collect data from our users.

As of March 12, 2023, Joe Comeau is the primary point of contact for necessary updates to these spreadsheets. Step 1 when these kinds of changes need to be made is to reach out to Joe to create a new version of the spreadsheet that incorporates the necessary changes.

We store past versions of the "input template" spreadsheets in the [./packages/server/src/arpa_reporter/data](./packages/server/src/arpa_reporter/data) directory. Filenames are of the form `ARPA SFRF Reporting Workbook v{DATE}.xlsm` where `{DATE}` is the date the new version was authored.

To add a new version of the spreadsheet, simply copy the most recent version of the spreadsheet into this directory and rename it according to this convention.

## Step 2: Generate New Rules

Once the spreadsheet has been updated, we need to generate new rules for the application to use to validate the data that users enter into the spreadsheet.

### Update Environment Variables

After obtaining the new empty input file template, it is important to first update the `EMPTY_TEMPLATE_NAME` variable in [environment.js](../../packages/server/src/arpa_reporter/environment.js) in the script to point to the new version of the spreadsheet that you just added to the `./packages/server/src/arpa_reporter/data` directory. This variable is used in subsequent steps to generate the new rules.

### Run the Script

Once this variable has been set, we use a script that is located in the `./packages/server/src/scripts` directory. This script is called `generateRules.mjs`.

To run this script, you can use the following command from within the `./packages/server` directory:

```bash
yarn run generate-rules
```

or from the top-level directory:

```bash
yarn workspace server run generate-rules
```

The script will make changes to the [templateRules.json](../../packages/server/src/arpa_reporter/lib/templateRules.json) file to reflect the changes that were made to the original spreadsheet. Double check this file to make sure that the changes are correct.

### Debug the Script

To debug the script, if you're using VSCode, you can run the script by using the `Generate Rules` configuration. You can then set necessary breakpoints

### Step 3: Implement Application Logic

Once the new rules have been generated, depending on the change we may need to implement any necessary application logic to support the new rules. This is usually done by adding new functions to the [validate-upload.js](../../packages/server/src/arpa_reporter/lib/validate-upload.js) file.

Specific modifications will depend on the nature of the changes that were made to the spreadsheet.

For many input template changes, such as changes to the field type of the file being uploaded, no change is necsesary on top of adding the new sheet and running the script. For more involved changes you made need to update `validate-upload.js`.

If you have any questions about this, please reach out to Joe Comeau.

### Step 4: Update Output Templates

Once the new rules have been generated and the application logic has been updated, we may also need to update the output templates to support the new rules.

This is not always necessary, as often the value in the output template is the same.

See [Updating Output Templates](./updating-output-templates.md) for more information on how to do this.

## Finish Up

To complete these changes, it's necessary to commit the following changes to the repository:

1. The new spreadsheet, located in [./packages/server/src/arpa_reporter/data](./packages/server/src/arpa_reporter/data). **IMPORTANT** you need to run `git add -f` to add this file! Github CI/CD will otherwise fail.
1. The changes to the `EMPTY_TEMPLATE_NAME` variable in [environment.js](../../packages/server/src/arpa_reporter/environment.js)
1. The new `templateRules.json` file, located in [./packages/server/src/arpa_reporter/lib](./packages/server/src/arpa_reporter/lib)
1. Any necessary changes to [validate-upload.js](../../packages/server/src/arpa_reporter/lib/validate-upload.js)

Include a commit message explaining the necessary changes.
