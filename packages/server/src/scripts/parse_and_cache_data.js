#!/usr/bin/env node
/* eslint-disable */

require("dotenv").config();

const { loadRecordsForUpload } = require('../arpa_reporter/services/records')
const _ = require("lodash");

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

    if (_.isEqual(records, updatedUpload.parsed_data)) {
        console.log("Cached data is equivalent to parsed data")
    } else {
        diff = compare(records, updatedUpload.parsed_data)
        console.log("ERROR: Cached and parsed data are not equivalent")
        console.log(diff)
    }

}

// This method is copied verbatim from https://stackoverflow.com/a/41431685/21046021
// and allows us to see every json path that differs between two objects
var compare = function (a, b) {
    var result = {
        different: [],
        missing_from_first: [],
        missing_from_second: []
    };

    _.reduce(a, function (result, value, key) {
        if (b.hasOwnProperty(key)) {
            if (_.isEqual(value, b[key])) {
                return result;
            } else {
                if (typeof (a[key]) != typeof ({}) || typeof (b[key]) != typeof ({})) {
                    //dead end.
                    result.different.push(key);
                    return result;
                } else {
                    var deeper = compare(a[key], b[key]);
                    result.different = result.different.concat(_.map(deeper.different, (sub_path) => {
                        return key + "." + sub_path;
                    }));

                    result.missing_from_second = result.missing_from_second.concat(_.map(deeper.missing_from_second, (sub_path) => {
                        return key + "." + sub_path;
                    }));

                    result.missing_from_first = result.missing_from_first.concat(_.map(deeper.missing_from_first, (sub_path) => {
                        return key + "." + sub_path;
                    }));
                    return result;
                }
            }
        } else {
            result.missing_from_second.push(key);
            return result;
        }
    }, result);

    _.reduce(b, function (result, value, key) {
        if (a.hasOwnProperty(key)) {
            return result;
        } else {
            result.missing_from_first.push(key);
            return result;
        }
    }, result);

    return result;
}

if (require.main === module) {
    main().then(() => process.exit());
}
