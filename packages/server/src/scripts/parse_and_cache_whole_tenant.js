#!/usr/bin/env node
/* eslint-disable */

require("dotenv").config();

const { loadRecordsForUpload } = require('../arpa_reporter/services/records')
const _ = require("lodash");
const { diff } = require('deep-diff');

const inquirer = require("inquirer");

// This is so named to keep from accidentally typing "knex" out of habit and thus having some
// queries inadvertently outside the transaction.
const knexWithoutTransaction = require("../db/connection");
const { getUpload, cacheRecords, usedforTreasuryExportWithTenantId } = require("../arpa_reporter/db/uploads");
const {  getAllReportingPeriodsForTenantId } = require("../arpa_reporter/db/reporting-periods");

async function main() {
    if (!process.env.POSTGRES_URL) {
        console.error("must specify POSTGRES_URL env variable");
        return;
    }
    console.log(
        "Parsing and caching upload data with postgres db: ",
        process.env.POSTGRES_URL
    );

    const { tenantId } = await inquirer.prompt([
        {
            type: "input",
            name: "tenantId",
            message: "What is the tenantId you want to populate the cache for:",
        },
    ])

    console.log("Parsing and caching all active uploads for tenant with id", tenantId);

    const reportingPeriods = await getAllReportingPeriodsForTenantId(tenantId)
    const uploads = (await Promise.all(
        reportingPeriods.flatMap(period => usedforTreasuryExportWithTenantId(tenantId, period.id))
    )).flat()

    console.log(`Parsing and caching data for ${uploads.length} uploads, with ids ${uploads.map(u => u.id)}`)
    for (const upload of uploads) {
        const records = await loadRecordsForUpload(upload)
        await cacheRecords(upload, records)

        /* TODO: Eventually we'll want to verify the diffs, but there is a known mismatch with timestamps currently 
        const updatedUpload = await getUpload(upload.id)
        const differences = diff(records, updatedUpload.parsed_data)
        if (differences.length === 0) {
            console.log("Cached data is equivalent to parsed data")
        } else {
            console.log("ERROR: Cached and parsed data are not equivalent")
            console.log(differences)
        }
        */
    }
}

if (require.main === module) {
    main().then(() => process.exit());
}

/* Some useful SQL queries:

Check all rows with cached data:
SELECT * FROM uploads WHERE parsed_data is NOT NULL


Wipe the cache:
UPDATE uploads
SET
  parsed_data_cached_at = NULL,
  parsed_data = NULL
WHERE
  parsed_data IS NOT NULL OR 
  parsed_data_cached_at IS NOT NULL

  */