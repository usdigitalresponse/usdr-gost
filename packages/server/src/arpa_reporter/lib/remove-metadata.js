const SHEETS_WITHOUT_METADATA = ['certification', 'cover']
const NUM_METADATA_COLS = 1 // number of leftmost columns to ignore

/**
 * The macro-powered ARPA reporting input template uses the first ten rows for
 * metadata. This data was useful while authoring the input template, but is not
 * useful for reporting.
 *
 * This method identifies sheets with this pattern and removes these rows.
 *
 * @param {string} sheetName
 * @param {any[][]} sheet
 */
function removeMetadata (sheetName, sheet) {
  if (SHEETS_WITHOUT_METADATA.includes(sheetName.toLowerCase())) {
    return sheet
  }

  const headerRowIndex = sheet.findIndex(row =>
    ['label', 'column label'].includes(row[0]?.toLowerCase())
  )

  return sheet.slice(headerRowIndex).map(row => row.slice(NUM_METADATA_COLS))
}

module.exports = {
  removeMetadata
}

// NOTE: This file was copied from src/server/lib/remove-metadata.js (git @ 26f71a0d6d) in the arpa-reporter repo on 2022-09-12T21:06:59.476Z
