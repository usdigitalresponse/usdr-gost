/* eslint camelcase: 0 */

const path = require('path')
const fs = require('fs/promises')
const _ = require('lodash');

const Cryo = require('cryo');
const XLSX = require('xlsx');

const { getReportingPeriod } = require('../db/reporting-periods');
const { createUpload } = require('../db/uploads');
const { TEMP_DIR, UPLOAD_DIR } = require('../environment');
const { log } = require('../lib/log');
const ValidationError = require('../lib/validation-error');

// WARNING: changes to this function must be made with care, because:
//  1. there may be existing data on disk with filenames set according to this function,
//     which could become inaccessible
//  2. this function is duplicated in GOST's import_arpa_reporter_dump.js script
const uploadFSName = (upload) => {
    const filename = `${upload.id}${path.extname(upload.filename)}`;
    return path.join(UPLOAD_DIR, filename);
};

const jsonFSName = (upload) => {
    const filename = `${upload.id}.json`;
    return path.join(TEMP_DIR, upload.id[0], filename);
};

async function persistUpload({ filename, user, buffer }) {
    // let's make sure we can actually read the supplied buffer (it's a valid spreadsheet)
    try {
        await XLSX.read(buffer, { type: 'buffer' });
    } catch (e) {
        throw new ValidationError(`Cannot parse XLSX from data in ${filename}: ${e}`);
    }

    // get the current reporting period
    const reportingPeriod = await getReportingPeriod();

    // create an upload
    const uploadRow = {
        filename: path.basename(filename),
        reporting_period_id: reportingPeriod.id,
        user_id: user.id,
    };
    const upload = await createUpload(uploadRow);

    // persist the original upload to the filesystem
    try {
        const uploadFilename = uploadFSName(upload);
        await fs.mkdir(path.dirname(uploadFilename), { recursive: true });
        await fs.writeFile(uploadFilename, buffer, { flag: 'wx' });
    } catch (e) {
        throw new ValidationError(`Cannot persist ${upload.filename} to filesystem: ${e}`);
    }

    // return the upload we created
    return upload;
}

const jsonFSName = (upload) => {
  const filename = `${upload.id}.json`
  return path.join(TEMP_DIR, upload.id[0], filename)
}


async function validateBuffer(buffer) {
  try {
    await XLSX.read(buffer, { type: 'buffer' });
  } catch (e) {
    throw new ValidationError(`Cannot parse XLSX from supplied data: ${e}`);
  }
}

function createUploadRow(filename, reportingPeriod, user, body) {
  const escapedNotes = _.escape(body.notes);
  return {
    filename: path.basename(filename),
    reporting_period_id: reportingPeriod.id,
    user_id: user.id,
    notes: escapedNotes ?? null,
  };
}

async function persistUploadToFS(upload, buffer) {
  try {
    const filename = uploadFSName(upload);
    await fs.mkdir(path.dirname(filename), { recursive: true });
    await fs.writeFile(filename, buffer, { flag: 'wx' });
  } catch (e) {
    throw new ValidationError(`Cannot persist ${upload.filename} to filesystem: ${e}`);
  }
}

async function persistUpload ({ filename, user, buffer, body }) {
  // Make sure we can actually read the supplied buffer (it's a valid spreadsheet)
  await validateBuffer(buffer);

  // Get the current reporting period
  const reportingPeriod = await getReportingPeriod();

  // Create the upload row
  const uploadRow = createUploadRow(filename, reportingPeriod, user, body);

  // Create the upload
  const upload = await createUpload(uploadRow);

  // Persist the upload to the filesystem
  await persistUploadToFS(upload, buffer);

  // Return the upload we created
  return upload;
}

async function persistJson (upload, workbook) {
  // persist the parsed JSON from an upload to the filesystem
  try {
    const filename = jsonFSName(upload)
    await fs.mkdir(path.dirname(filename), { recursive: true })
    await fs.writeFile(filename, Cryo.stringify(workbook), { flag: 'wx' })
  } catch (e) {
    throw new ValidationError(`Cannot persist ${upload.filename} to filesystem: ${e}`)
  }
}

async function bufferForUpload(upload) {
    return fs.readFile(uploadFSName(upload));
}

async function jsonForUpload(upload) {
    return Cryo.parse(await fs.readFile(jsonFSName(upload), { encoding: 'utf-8' }));
}

/**
 * As of xlsx@0.18.5, the XLSX.read operation is very inefficient.
 * This function abstracts XLSX.read, and incorporates a local disk cache to
 * avoid running the parse operation more than once per upload.
 *
 * @param {*} upload DB upload content
 * @param {XLSX.ParsingOptions} options The options object that will be passed to XLSX.read
 * @return {XLSX.Workbook}s The uploaded workbook, as parsed by XLSX.read.
 */
async function workbookForUpload(upload, options) {
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
        workbook = XLSX.read(buffer, options);

        persistJson(upload, workbook);
    }

    return workbook;
}

module.exports = {
  persistUpload,
  bufferForUpload,
  workbookForUpload,
  uploadFSName,
}

// NOTE: This file was copied from src/server/services/persist-upload.js (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z
