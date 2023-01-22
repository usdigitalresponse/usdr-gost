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
const { getUpload, cacheRecords } = require("../arpa_reporter/db/uploads");

async function main() {
    if (!process.env.POSTGRES_URL) {
        console.error("must specify POSTGRES_URL env variable");
        return;
    }
    console.log(
        "Parsing and caching upload data with postgres db: ",
        process.env.POSTGRES_URL
    );

    const { uploadId } = await inquirer.prompt([
        {
            type: "input",
            name: "uploadId",
            message: "What is the uuid of the upload you want to parse and cache:",
        },
    ])

    console.log("Parsing and caching upload with id:", uploadId);
    const upload = await getUpload(uploadId)
    const records = await loadRecordsForUpload(upload)

    await cacheRecords(upload, records)

    // Now that the data has been written, check that it matches what we parsed from excel
    const updatedUpload = await getUpload(uploadId)

    const differences = diff(records, updatedUpload.parsed_data)
    if (differences.length === 0) {
        console.log("Cached data is equivalent to parsed data")
    } else {
        console.log("ERROR: Cached and parsed data are not equivalent")
        console.log(differences)
    }
}

if (require.main === module) {
    main().then(() => process.exit());
}
