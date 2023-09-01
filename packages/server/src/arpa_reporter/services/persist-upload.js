/* eslint camelcase: 0 */

const tracer = require('dd-trace');
const path = require('path');
const fs = require('fs/promises');
const _ = require('lodash');

const Cryo = require('cryo');
const XLSX = require('xlsx');

const { getReportingPeriod } = require('../db/reporting-periods');
const { getTenantAgencies } = require('../../db');
const { user: getUser } = require('../../db/arpa_reporter_db_shims/users');

const { createUpload } = require('../db/uploads');
const { TEMP_DIR, UPLOAD_DIR } = require('../environment');
const { log } = require('../lib/log');
const ValidationError = require('../lib/validation-error');
const { useTenantId } = require('../use-request');

/**
 * Get the path to the upload file for the given upload
 *
 * WARNING: changes to this function must be made with care, because:
 * 1. there may be existing data on disk with filenames set according to this function, which could become inaccessible
 * 2. this function is duplicated in GOST's import_arpa_reporter_dump.js script
 *
 * @param {object} upload
 * @returns {string}
*/
const uploadFSName = (upload) => {
    const filename = `${upload.id}${path.extname(upload.filename)}`;
    return path.join(UPLOAD_DIR, filename);
};

/**
 * Get the path to the JSON file for the given upload
 * @param {object} upload
 * @returns {string}
*/
const jsonFSName = (upload) => {
    const filename = `${upload.id}.json`;
    return path.join(TEMP_DIR, upload.id[0], filename);
};

/**
 * Get the path to the JSON file for cached reporting periods
 * @param {object} reportingPeriod
 * @param {int} tenantId
 * @returns {string}
*/
const cacheFSName = (reportingPeriod, tenantId = null) => {
    const filename = `${tenantId || useTenantId()}.${reportingPeriod.id}.json`;
    return path.join(TEMP_DIR, filename);
};

/**
 * Attempt to parse the buffer as an XLSX file
 * @param {Buffer} buffer
 * @returns {Promise<void>}
 * @throws {ValidationError}
 */
async function validateBuffer(buffer) {
    try {
        await XLSX.read(buffer, { type: 'buffer' });
    } catch (e) {
        throw new ValidationError(`Cannot parse XLSX from supplied data: ${e}`);
    }
}

/**
 * Create Upload row object
 * @param {object} uploadData
 * @returns {object}
*/
function createUploadRow(uploadData) {
    const {
        filename, reportingPeriodId, userId, agencyId, notes,
    } = uploadData;

    return {
        filename: path.basename(filename),
        reporting_period_id: reportingPeriodId,
        user_id: userId,
        agency_id: agencyId,
        notes: notes ?? null,
    };
}

/**
 * Persist the upload to the filesystem
 * @param {object} upload
 * @param {Buffer} buffer
 * @returns {Promise<void>}
 * @throws {ValidationError}
*/
async function persistUploadToFS(upload, buffer) {
    return tracer.trace('persistUploadToFS', async () => {
        try {
            const filename = uploadFSName(upload);
            await fs.mkdir(path.dirname(filename), { recursive: true });
            await fs.writeFile(filename, buffer, { flag: 'wx' });
        } catch (e) {
            throw new ValidationError(`Cannot persist ${upload.filename} to filesystem: ${e}`);
        }
    });
}

/**
 * Escape notes text
 * @param {string} notes
 * @returns {string|null}
 */
function ensureValidNotes(notes) {
    return notes ? _.escape(notes) : null;
}

/**
 * Validate the agency ID
 * @param {string} agencyId
 * @param {string} userId
 * @returns {string|null}
 * @throws {ValidationError}
 */
async function ensureValidAgencyId(agencyId, userId) {
    // If agencyId is null, it's ok. We derive this later from the spreadsheet
    // itself in validate-upload. We leave it as null here.
    if (!agencyId) {
        return null;
    }
    // Otherwise, we need to make sure the user is associated with the agency
    const userRecord = await getUser(userId);
    const tenantAgencies = await getTenantAgencies(userRecord.tenant_id);
    const agency = tenantAgencies.find((a) => a.id === Number(agencyId));
    if (!agency) {
        throw new ValidationError(`Supplied agency ID ${agencyId} does not correspond to an agency in the user's tenant ${userRecord.tenant_id}. Please report this issue to USDR.`);
    }
    return agencyId;
}

/**
 * Validate the reporting period ID
 * @param {string} reportingPeriodId
 * @returns {string}
 * @throws {ValidationError}
 */
async function ensureValidReportingPeriodId(reportingPeriodId) {
    // Get the current reporting period. Passing an undefined value
    // defaults to the current period.
    const reportingPeriod = await getReportingPeriod(reportingPeriodId);

    if (!reportingPeriod) {
        throw new ValidationError(`Supplied reporting period ID ${reportingPeriodId} does not correspond to any existing reporting period. Please report this issue to USDR.`);
    }
    return reportingPeriod.id;
}

/**
 * Persist an upload to the filesystem
 * @param {string} filename
 * @param {object} user
 * @param {Buffer} buffer
 * @param {object} body
 * @returns {object} upload
 * @throws {ValidationError}
*/
async function persistUpload({
    filename, user, buffer, body,
}) {
    return tracer.trace(
        'persistUpload',
        async () => {
            // Fetch reportingPeriodId, agencyId, and notes from the body
            // and rename with 'supplied' prefix. These may be null.
            const {
                reportingPeriodId: suppliedReportingPeriodId,
                agencyId: suppliedAgencyId,
                notes: suppliedNotes,
            } = body;

            // Make sure we can actually read the supplied buffer (it's a valid spreadsheet)
            await validateBuffer(buffer);

            // Either use supplied reportingPeriodId,
            // or fall back to the current reporting period ID if undefined
            const validatedReportingPeriodId = await ensureValidReportingPeriodId(suppliedReportingPeriodId);

            // Check if the user is affiliated with the given agency,
            // or leave undefined (we'll derive it later from the spreadsheet)
            const validatedAgencyId = await ensureValidAgencyId(suppliedAgencyId, user.id);

            // Escape note text
            const validatedNotes = ensureValidNotes(suppliedNotes);

            // Create the upload row
            const uploadData = {
                filename,
                reportingPeriodId: validatedReportingPeriodId,
                userId: user.id,
                agencyId: validatedAgencyId,
                notes: validatedNotes,
            };
            const uploadRow = createUploadRow(uploadData);

            // Insert the upload row into the database
            const upload = await createUpload(uploadRow);

            // Persist the upload to the filesystem
            await persistUploadToFS(upload, buffer);

            // Return the upload we created
            return upload;
        },
    );
}

/**
 * Persist the workbook to the filesystem
 * @param {object} upload
 * @param {object} workbook
 * @returns {Promise<void>}
 * @throws {ValidationError}
*/
async function persistJson(upload, workbook) {
    return tracer.trace(
        'persistJson',
        async () => {
            try {
                const filename = jsonFSName(upload);
                await fs.mkdir(path.dirname(filename), { recursive: true });
                await fs.writeFile(filename, Cryo.stringify(workbook), { flag: 'wx' });
            } catch (e) {
                throw new ValidationError(`Cannot persist ${upload.filename} to filesystem: ${e}`);
            }
        },
    );
}

/**
 * Get the buffer for an upload
 * @param {object} upload
 * @returns {Promise<Buffer>}
*/
async function bufferForUpload(upload) {
    return tracer.trace(
        'bufferForUpload',
        () => fs.readFile(uploadFSName(upload)),
    );
}

/**
 * Get JSON for an upload
 * @param {object} upload
 * @returns {Promise<object>}
*/
async function jsonForUpload(upload) {
    return tracer.trace(
        'jsonForUpload',
        async () => {
            const file = await tracer.trace('fs.readFile', async (span) => {
                const f = await fs.readFile(jsonFSName(upload), { encoding: 'utf-8' });
                const { size } = await fs.stat(jsonFSName(upload));
                span.setTag('filesize-kb', Math.round(size / (2 ** 10)));
                span.setTag('tenant-id', upload.tenant_id);
                span.setTag('reporting-period-id', upload.reporting_period_id);
                return f;
            });
            return tracer.trace('Cryo.parse', () => Cryo.parse(file));
        },
    );
}

/**
 * Get the workbook for an upload
 *
 * As of xlsx@0.18.5, the XLSX.read operation is very inefficient.
 * This function abstracts XLSX.read, and incorporates a local disk cache to
 * avoid running the parse operation more than once per upload.
 *
 * @param {*} upload DB upload content
 * @param {XLSX.ParsingOptions} options The options object that will be passed to XLSX.read
 * @return {XLSX.Workbook}s The uploaded workbook, as parsed by XLSX.read.
 */
async function workbookForUpload(upload, options) {
    return tracer.trace(
        'workbookForUpload',
        async () => {
            log(`workbookForUpload(${upload.id})`);

            let workbook;
            try {
            // attempt to read pre-parsed JSON, if it exists
                log(`attempting cache lookup for parsed workbook`);
                workbook = await jsonForUpload(upload);
            } catch (e) {
            // fall back to reading the originally-uploaded .xlsm file and parsing it
                log(`cache lookup failed, parsing originally uploaded .xlsm file`);
                const buffer = await bufferForUpload(upload);

                // NOTE: This is the slow line!
                log(`XLSX.read(${upload.id})`);
                workbook = tracer.trace('XLSX.read()', () => XLSX.read(buffer, options));

                persistJson(upload, workbook);
            }

            return workbook;
        },
    );
}

module.exports = {
    persistUpload,
    bufferForUpload,
    workbookForUpload,
    uploadFSName,
    cacheFSName,
};

// NOTE: This file was copied from src/server/services/persist-upload.js (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z
