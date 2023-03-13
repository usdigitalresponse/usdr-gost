# Updating Templates

This document describes the process for updating the input and output templates used by the ARPA Reporter application.

- [Updating Templates](#updating-templates)
  - [Product Overview](#product-overview)
  - [Reasoning](#reasoning)
  - [Technical Overview](#technical-overview)
    - [Updating Input Templates - Specifics](#updating-input-templates---specifics)
    - [Updating Output Templates - Specifics](#updating-output-templates---specifics)

## Product Overview

Occasionally (usually quarterly), the Treasury will update its requirements for reporting on federal grants, usually to add or update fields. When this happens, we typically need to make three updates:

1. We update what we call our "input templates" to make it easier / more convenient to collect the new data from our users at the point of entry.
2. We update our application logic to support the new data.
3. We update our "output templates" and associated mappings to generate the correct new spreadsheets so as to be ready for bulk upload to the Treasury's system.

## Reasoning

We try to implement as much logic as possible within our input templates, the spreadsheets that agency partners use directly to enter data. This is because feedback is a lot more immediate when we can provide validation errors directly in the spreadsheet itself.

That said, the logic within these sheets is locked up within Excel, which makes it difficult to version and update. Additionally, there are ways to violate the rules that we have implemented in the spreadsheet. Therefore, it's necessary to have a second layer of validation in the application itself.

To accomplish this, we use a script to generate a json representation of the rules in use in the spreadsheet, [templateRules.json](../../packages/server/src/arpa_reporter/lib/templateRules.json).

This json file is then used by the application to validate the data that users enter into the spreadsheet. We may also apply additional conditional logic at the application level, usually within [validate-upload.js](../../packages/server/src/arpa_reporter/lib/validate-upload.js).

Finally, we essentially do the same in reverse for the output templates. We use another script to generate a json representation of the output templates, which we store as [outputTemplates.json](../../packages/server/src/arpa_reporter/lib/outputTemplates.json).

## Technical Overview

The task of updating input templates has 5 basic steps:

1. Update the spreadsheets that we use to collect data from our users, and store the sheet in the `../../packages/server/src/arpa_reporter/data` directory.
2. Run the `generateTemplateRules.js` script to generate a new `templateRules.json` file that contains the validation rules for the new spreadsheet.
3. (If necessary) Implementing any necessary application-layer logic.
4. Replacing the new output template spreadsheet in the [../../packages/server/src/arpa_reporter/data/treasury](./packages/server/src/arpa_reporter/data/treasury) directory.
5. Running the [parseOutputTemplates.mjs](src/scripts/parseOutputTemplates.mjs) script to generate a new `outputTemplates.json` file that represents the requirements for the output template files.

### Updating Input Templates - Specifics

See the [Updating Input Templates](./updating-input-templates.md) document for more details.

### Updating Output Templates - Specifics

See the [Updating Output Templates](./updating-output-templates.md) document for more details.
