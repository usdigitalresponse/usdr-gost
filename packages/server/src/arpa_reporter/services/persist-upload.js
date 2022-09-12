/* eslint camelcase: 0 */

const path = require('path')
const { mkdir, writeFile, readFile } = require('fs/promises')

const xlsx = require('xlsx')

const { getReportingPeriod } = require('../db/reporting-periods')
const { createUpload } = require('../db/uploads')
const { UPLOAD_DIR } = require('../environment')
const ValidationError = require('../lib/validation-error')

// WARNING: changes to this function must be made with care, because:
//  1. there may be existing data on disk with filenames set according to this function,
//     which could become inaccessible
//  2. this function is duplicated in GOST's import_arpa_reporter_dump.js script
const uploadFSName = (upload) => {
  const filename = `${upload.id}${path.extname(upload.filename)}`
  return path.join(UPLOAD_DIR, filename)
}

async function persistUpload ({ filename, user, buffer }) {
  // let's make sure we can actually read the supplied buffer (it's a valid spreadsheet)
  try {
    await xlsx.read(buffer, { type: 'buffer' })
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
    await mkdir(UPLOAD_DIR, { recursive: true })
    await writeFile(
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

async function bufferForUpload (upload) {
  return readFile(uploadFSName(upload))
}

module.exports = {
  persistUpload,
  bufferForUpload,
  uploadFSName
}

// NOTE: This file was copied from src/server/services/persist-upload.js (git @ 26f71a0d6d) in the arpa-reporter repo on 2022-09-12T21:06:59.476Z
