const { isNotBlank, isValidDate } = require('./validate')
const { validateSingleRecord } = require('./validate')

const requiredFields = [
  [
    'agency financial reviewer name',
    isNotBlank,
    'Agency financial reviewer name must not be blank'
  ],
  ['date', isValidDate, 'Date must be a valid date', { isDate: true }]
]

module.exports = validateSingleRecord(
  'certification',
  requiredFields,
  'certification requires a row with "agency financial reviewer name" and "date"'
)

// NOTE: This file was copied from src/server/services/validate-data/certification.js (git @ 98c1aa2586) in the arpa-reporter repo on 2022-09-02T05:09:55.179Z
