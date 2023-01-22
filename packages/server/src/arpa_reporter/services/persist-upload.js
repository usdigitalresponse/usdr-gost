/* eslint camelcase: 0 */

const path = require('path')
const fs = require('fs/promises')

const Cryo = require('cryo')
const XLSX = require('xlsx')

const { getReportingPeriod } = require('../db/reporting-periods')
const { createUpload } = require('../db/uploads')
const { TEMP_DIR, UPLOAD_DIR } = require('../environment')
const { log } = require('../lib/log')
const ValidationError = require('../lib/validation-error')

let XLSX_READ_TIME = 0

// WARNING: changes to this function must be made with care, because:
//  1. there may be existing data on disk with filenames set according to this function,
//     which could become inaccessible
//  2. this function is duplicated in GOST's import_arpa_reporter_dump.js script
const uploadFSName = (upload) => {
  const filename = `${upload.id}${path.extname(upload.filename)}`
  return path.join(UPLOAD_DIR, filename)
}

const jsonFSName = (upload) => {
  const filename = `${upload.id}.json`
  return path.join(TEMP_DIR, filename)
}

async function persistUpload ({ filename, user, buffer }) {
  // let's make sure we can actually read the supplied buffer (it's a valid spreadsheet)
  try {
    await XLSX.read(buffer, { type: 'buffer' })
  } catch (e) {
    throw new ValidationError(`Cannot parse XLSX from data in ${filename}: ${e}`)
  }

  // get the current reporting period
  const reportingPeriod = await getReportingPeriod()

  // create an upload
  const uploadRow = {
    filename: path.basename(filename),
    reporting_period_id: reportingPeriod.id,
    user_id: user.id
  }
  const upload = await createUpload(uploadRow)

  // persist the original upload to the filesystem
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true })
    await fs.writeFile(
      uploadFSName(upload),
      buffer,
      { flag: 'wx' }
    )
  } catch (e) {
    throw new ValidationError(`Cannot persist ${upload.filename} to filesystem: ${e}`)
  }

  // return the upload we created
  return upload
}

async function persistJson (upload, workbook) {
  // persist the parsed JSON from an upload to the filesystem
  try {
    await fs.mkdir(TEMP_DIR, { recursive: true })
    await fs.writeFile(
      jsonFSName(upload),
      Cryo.stringify(workbook),
      { flag: 'wx' }
    )
  } catch (e) {
    throw new ValidationError(`Cannot persist ${upload.filename} to filesystem: ${e}`)
  }
}

async function bufferForUpload (upload) {
  const start = performance.now()
  const buffer = await fs.readFile(uploadFSName(upload))
  console.log(`bufferForUpload: ${performance.now() - start}ms`)
  return buffer
}

async function jsonForUpload (upload) {
  const start = performance.now();
  const json = Cryo.parse(await fs.readFile(jsonFSName(upload), {encoding: 'utf-8'}))
  console.log(`jsonForUpload: ${performance.now() - start}ms`)
  return json
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
async function workbookForUpload (upload, options) {
  const start = performance.now()
  log(`workbookForUpload(${upload.id})`)

  let workbook
  try {
    // attempt to read pre-parsed JSON, if it exists
    log(`attempting cache lookup for parsed workbook`)
    workbook = await jsonForUpload(upload)
  } catch (e) {
    // fall back to reading the originally-uploaded .xlsm file and parsing it
    log(`cache lookup failed, parsing originally uploaded .xlsm file`)
    const buffer = await bufferForUpload(upload)

    const start = performance.now()
    // NOTE: This is the slow line!
    log(`XLSX.read(${upload.id})`)
    workbook = XLSX.read(buffer, options)
    const duration = performance.now() - start
    XLSX_READ_TIME += duration
    console.log(`XLSX.read: ${duration}ms`)
    console.log(`cumulative XLSX.read: ${XLSX_READ_TIME}ms`)

    // persistJson(upload, workbook)
  }

  console.log(`workbookForUpload: ${performance.now() - start}ms`)

  return workbook
}

module.exports = {
  persistUpload,
  workbookForUpload,
  uploadFSName,

  // exported for test purposes only!
  _uploadFSName: uploadFSName,
  _jsonFSName: jsonFSName,
  _persistJson: persistJson,
  _jsonForUpload: jsonForUpload,
}

// NOTE: This file was copied from src/server/services/persist-upload.js (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z
