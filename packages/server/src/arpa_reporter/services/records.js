const XLSX = require('xlsx');
const { merge } = require('lodash');

const asyncBatch = require('async-batch').default;
const { workbookForUpload } = require('./persist-upload');
const { getPreviousReportingPeriods } = require('../db/reporting-periods');
const { usedForTreasuryExport } = require('../db/uploads');
const { log } = require('../lib/log');
const { requiredArgument } = require('../lib/preconditions');
const { getRules } = require('./validation-rules');
const { useRequest } = require('../use-request');

const CERTIFICATION_SHEET = 'Certification';
const COVER_SHEET = 'Cover';
const LOGIC_SHEET = 'Logic';

const EC_SHEET_TYPES = {
    'EC 1 - Public Health': 'ec1',
    'EC 2 - Negative Economic Impact': 'ec2',
    'EC 3 - Public Sector Capacity': 'ec3',
    'EC 4 - Premium Pay': 'ec4',
    'EC 5 - Infrastructure': 'ec5',
    'EC 7 - Admin': 'ec7',
};

const DATA_SHEET_TYPES = {
    ...EC_SHEET_TYPES,
    Subrecipient: 'subrecipient',
    'Awards > 50000': 'awards50k',
    'Expenditures > 50000': 'expenditures50k',
    'Aggregate Awards < 50000': 'awards',
};

const TYPE_TO_SHEET_NAME = Object.fromEntries(
    Object.entries(DATA_SHEET_TYPES).map(([sheetName, type]) => [type, sheetName]),
);

function readVersionRecord(workbook) {
    const range = {
        s: { r: 0, c: 1 },
        e: { r: 0, c: 1 },
    };

    const [row] = XLSX.utils.sheet_to_json(
        workbook.Sheets[LOGIC_SHEET],
        { header: 1, range },
    );

    return {
        version: row[0],
    };
}

/**
 * Load an uploaded spreadsheet from disk and parse it into "records". Each
 * record corresponds to one row in the upload.
 *
 * @param {object} upload The upload to read
 * @returns {Promise<object[]>}
 */
async function loadRecordsForUpload(upload) {
    log(`loadRecordsForUpload(${upload.id})`);

    const rules = getRules();

    // NOTE: workbookForUpload relies on a disk cache for optimization.
    // If you change any of the below parsing parameters, you will need to
    // clear the server's TEMP_DIR folder to ensure they take effect.
    const workbook = await workbookForUpload(upload, {
        cellDates: true,
        type: 'buffer',
        sheets: [CERTIFICATION_SHEET, COVER_SHEET, LOGIC_SHEET, ...Object.keys(DATA_SHEET_TYPES)],
    });

    // parse certification and cover as special cases
    const [certification] = XLSX.utils.sheet_to_json(workbook.Sheets[CERTIFICATION_SHEET]);
    const [cover] = XLSX.utils.sheet_to_json(workbook.Sheets[COVER_SHEET]);
    const subcategory = cover['Detailed Expenditure Category'];

    const records = [
        { type: 'certification', upload, content: certification },
        { type: 'cover', upload, content: cover },
        { type: 'logic', upload, content: readVersionRecord(workbook) },
    ];

    // parse data sheets
    Object.keys(DATA_SHEET_TYPES).forEach((sheetName) => {
        const type = DATA_SHEET_TYPES[sheetName];
        const sheet = workbook.Sheets[sheetName];
        const sheetAttributes = workbook.Workbook.Sheets.find(
            (sht) => sht.name === sheetName,
        );

        // ignore hidden sheets
        if (sheetAttributes.Hidden !== 0) {
            return;
        }

        const rulesForCurrentType = rules[type];

        // entire sheet
        const sheetRange = XLSX.utils.decode_range(sheet['!ref']);

        // range C3:3
        const headerRange = merge({}, sheetRange, {
            s: { c: 2, r: 2 },
            e: { r: 2 },
        });

        // TODO: How can we safely get the row number in which data starts
        // across template versions?
        // range C13:
        const contentRange = merge({}, sheetRange, { s: { c: 2, r: 12 } });

        const [header] = XLSX.utils.sheet_to_json(sheet, {
            header: 1, // ask for array-of-arrays
            range: XLSX.utils.encode_range(headerRange),
        });

        // actually read the rows
        const rows = XLSX.utils.sheet_to_json(sheet, {
            header,
            range: XLSX.utils.encode_range(contentRange),
            blankrows: false,
        });

        // each row in the input sheet becomes a unique record
        rows.forEach((row) => {
            // Don't include any Display_Only data in the records
            delete row.Display_Only;
            // If the row is empty, don't include it in the records
            if (Object.keys(row).length === 0) {
                return;
            }
            const formattedRow = {};
            Object.keys(row).forEach((fieldId) => {
                let value = row[fieldId];
                if (!rulesForCurrentType[fieldId]) {
                    // No known rules for this type, so we can't format it.
                    return;
                }
                const { persistentFormatters } = rulesForCurrentType[fieldId];
                persistentFormatters.forEach((formatter) => {
                    try {
                        value = formatter(value);
                    } catch (e) {
                        console.log(`Persistent formatter failed to format value ${value} with error:`, e);
                    }
                });
                formattedRow[fieldId] = value;
            });
            records.push({
                type, subcategory, upload, content: formattedRow,
            });
        });
    });

    return records;
}

/**
 * Wraps loadRecordsForUpload with per-request memoization. This ensures that
 * the same upload is not read from the filesystem more than once during a
 * single request.
 *
 * @param {object} upload The upload to fetch records for.
 * @returns {Promise<object[]>} A list of records corresponding to the requested upload
 */
async function recordsForUpload(upload) {
    log(`recordsForUpload(${upload.id})`);

    const req = useRequest();
    if (!req.recordsForUpload) {
        req.recordsForUpload = {};
    }
    if (req.recordsForUpload[upload.id]) {
        log(`recordsForUpload(${upload.id}): reading from cache`);
        return req.recordsForUpload[upload.id];
    }
    log(`recordsForUpload(${upload.id}): reading from disk`);
    const recordPromise = loadRecordsForUpload(upload);

    // By caching the promise, we ensure that parallel fetches won't start a new
    // filesystem read, even if the first read hasn't resolved yet.
    req.recordsForUpload[upload.id] = recordPromise;

    return recordPromise;
}

async function recordsForReportingPeriod(periodId) {
    log(`recordsForReportingPeriod(${periodId})`);
    requiredArgument(periodId, 'must specify periodId in recordsForReportingPeriod');

    const uploads = await usedForTreasuryExport(periodId);
    const groupedRecords = await asyncBatch(uploads, recordsForUpload, 2);
    return groupedRecords.flat();
}

/**
 * Get the most recent, validated record for each unique project, as of the
 * specified reporting period.
*/
async function mostRecentProjectRecords(periodId) {
    log(`mostRecentProjectRecords(${periodId})`);
    requiredArgument(periodId, 'must specify periodId in mostRecentProjectRecords');

    const reportingPeriods = await getPreviousReportingPeriods(periodId);

    const inputs = [];
    reportingPeriods.forEach((rp) => inputs.push(rp.id));
    const allRecords = await asyncBatch(inputs, recordsForReportingPeriod, 2);

    const latestProjectRecords = allRecords
        .flat()
    // exclude non-project records
        .filter((record) => Object.values(EC_SHEET_TYPES).includes(record.type))
    // collect the latest record for each project ID
        .reduce(
            (accumulator, record) => {
                accumulator[record.content.Project_Identification_Number__c] = record;
                return accumulator;
            },
            {},
        );

    return Object.values(latestProjectRecords);
}

module.exports = {
    recordsForReportingPeriod,
    recordsForUpload,
    mostRecentProjectRecords,
    DATA_SHEET_TYPES,
    TYPE_TO_SHEET_NAME,
    readVersionRecord,
};

// NOTE: This file was copied from src/server/services/records.js (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z
