const { matchesFilePart } = require('./validate')
const { validateSingleRecord } = require('./validate')

const requiredFields = [
  [
    'agency code',
    matchesFilePart('agencyCode'),
    'The agency code "{}" in the file name does not match the cover\'s agency code'
  ]
]

module.exports = validateSingleRecord(
  'cover',
  requiredFields,
  'cover requires a row with "agency code"'
)

// NOTE: This file was copied from src/server/services/validate-data/cover.js (git @ 98c1aa2586) in the arpa-reporter repo on 2022-09-02T05:09:55.179Z
