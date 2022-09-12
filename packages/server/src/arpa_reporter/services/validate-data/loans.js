const {
  cumulativeAmountIsEqual,
  dateIsInReportingPeriod,
  dropdownIncludes,
  isNotBlank,
  isNumberOrBlank,
  isPositiveNumberOrZero,
  isValidDate,
  isValidState,
  isValidSubrecipient,
  isValidZip,
  loanMatches,
  matchesFilePart,
  numberIsLessThanOrEqual,
  validateRecords,
  whenNotBlank,
  whenUS
} = require('./validate')

// type pattern for this elements of the fields array is
// [
//   columnName: string,
//   validator: (val: any, content: obj?) => bool,
//   message: string?
// ]
const requiredFields = [
  [
    'project id',
    matchesFilePart('projectId'),
    'The loan project id "{}" does not match the project id in the filename'
  ],
  [
    'subrecipient id',
    isValidSubrecipient,
    'Each loan row must have a "subrecipient id" which is included in the "subrecipient" tab'
  ],

  ['loan number', isNotBlank, 'Load number must not be blank'],
  [

    'loan amount',
    isPositiveNumberOrZero,
    'Loan amount must be a number greater than or equal to zero'
  ],
  ['loan date', isValidDate, 'Loan date must be a valid date'],
  [
    'loan date',
    dateIsInReportingPeriod,
    'Loan date "{}" is not in the reporting period',
    { isDateValue: true }
  ],

  [
    'primary place of performance address line 1',
    isNotBlank,
    'primary place of business address line 1 must not be blank '
  ],
  [
    'primary place of performance city name',
    isNotBlank,
    'primary place of business city name must not be blank '
  ],
  [
    'primary place of performance state code',
    isValidState,
    'primary place of business state code must not be blank '
  ],
  [
    'primary place of performance zip',
    whenUS('primary place of performance country name', isValidZip),
    'primary place of business zip is not valid'
  ],
  [
    'primary place of performance country name',
    dropdownIncludes('country'),
    'primary place of business country name "{}" is not valid'
  ],

  [
    'current quarter obligation',
    isNumberOrBlank,
    'Current quarter obligation must be an amount'
  ],
  [
    'current quarter obligation',
    whenNotBlank('current quarter obligation', numberIsLessThanOrEqual('loan amount')),
    'Current quarter obligation must be less than or equal to loan amount'
  ],
  [
    'loan amount',
    cumulativeAmountIsEqual('current quarter obligation', loanMatches),
    'Loan amount must equal cumulative obligation amount',
    { tags: ['cumulative'] }
  ],
  [
    'payment amount',
    whenNotBlank('payment amount', isNumberOrBlank),
    'Payment amount must be a number'
  ],
  [
    'payment date',
    whenNotBlank('payment amount', isValidDate),
    'Payment date must be a valid date',
    { isDateValue: true }
  ]
]

module.exports = validateRecords('loans', requiredFields)

// NOTE: This file was copied from src/server/services/validate-data/loans.js (git @ 26f71a0d6d) in the arpa-reporter repo on 2022-09-12T21:06:59.476Z
