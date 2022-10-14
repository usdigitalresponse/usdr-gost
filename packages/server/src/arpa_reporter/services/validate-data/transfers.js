const {
  cumulativeAmountIsEqual,
  cumulativeAmountIsLessThanOrEqual,
  dateIsInReportingPeriod,
  dateIsOnOrBefore,
  dropdownIncludes,
  isEqual,
  isAtLeast50K,
  isNotBlank,
  isNumber,
  isNumberOrBlank,
  isSum,
  isValidDate,
  isValidSubrecipient,
  matchesFilePart,
  numberIsLessThanOrEqual,
  transferMatches,
  validateRecords,
  whenNotBlank,
  whenGreaterThanZero
} = require('./validate')

const expenditureCategories = require('./expenditure-categories')

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
    'The transfer project id "{}" does not match the project id in the filename'
  ],
  [
    'subrecipient id',
    isValidSubrecipient,
    'Each transfer row must have a "subrecipient id" which is included in the "subrecipient" tab'
  ],
  ['transfer number', isNotBlank, 'Transfer number cannot be blank'],
  [

    'award amount',
    whenNotBlank('total expenditure amount', isAtLeast50K),
    'Award amount must be at least $50,000',
    { tags: ['v2'] }
  ],
  [
    'transfer type',
    dropdownIncludes('award payment method'),
    'Transfer type "{}" is not valid'
  ],

  ['transfer date', isValidDate, 'Transfer date is not a valid date'],
  [
    'transfer date',
    dateIsInReportingPeriod,
    'Transfer date "{}" is not in reporting period',
    { isDateValue: true }
  ],

  [
    'current quarter obligation',
    isNumberOrBlank,
    'Current quarter obligation must be an amount'
  ],
  [

    'current quarter obligation',
    whenNotBlank('current quarter obligation', numberIsLessThanOrEqual('award amount')),
    'Transfer {{transfer number}} current quarter obligation {{current quarter obligation}} must be less than or equal to the award amount'
  ],
  [
    'award amount',
    isEqual('current quarter obligation'),
    'Award amount must equal obligation amount',
    { tags: ['v2'] }
  ],
  [
    'award amount',
    cumulativeAmountIsEqual('current quarter obligation', transferMatches),
    'Award amount must equal cumulative obligation amount',
    { tags: ['cumulative'] }
  ],
  [
    'award amount',
    cumulativeAmountIsLessThanOrEqual('total expenditure amount', transferMatches),
    'Cumulative expenditure amount must be less than or equal to award amount',
    { tags: ['cumulative'] }
  ],

  [
    'expenditure start date',
    whenGreaterThanZero('total expenditure amount', isValidDate),
    'Expenditure start date "{}" is not a valid date',
    { isDateValue: true }
  ],
  [
    'expenditure start date',
    whenGreaterThanZero('total expenditure amount', isValidDate),
    'Expenditure end date "{}" is not a valid date',
    { isDateValue: true }
  ],
  [
    'expenditure start date',
    whenGreaterThanZero(
      'total expenditure amount',
      dateIsOnOrBefore('transfer date')
    ),
    'Expenditure start date "{}" must be on or before transfer date',
    { isDateValue: true }
  ],
  [
    'expenditure start date',
    whenGreaterThanZero(
      'total expenditure amount',
      dateIsOnOrBefore('expenditure end date')
    ),
    'Expenditure start date "{}" must be on or before expenditure end date',
    { isDateValue: true }
  ],
  [
    'expenditure start date',
    whenGreaterThanZero('total expenditure amount', dateIsInReportingPeriod),
    'Expenditure start date "{}" must be in reporting period',
    { isDateValue: true }
  ],

  [
    'total expenditure amount',
    isNumberOrBlank,
    'Total expenditure amount must an amount'
  ],
  [
    'total expenditure amount',
    isSum(expenditureCategories),
    'Total expenditure amount is not the sum of all expenditure amount columns'
  ],
  [
    'other expenditure categories',
    whenNotBlank('other expenditure amount', isNotBlank),
    'Other Expenditure Categories cannot be blank if Other Expenditure Amount has an amount'
  ],
  [
    'other expenditure amount',
    whenNotBlank('other expenditure categories', isNumber),
    'Other Expenditure Amount must be a number'
  ]
]

module.exports = validateRecords('transfers', requiredFields)

// NOTE: This file was copied from src/server/services/validate-data/transfers.js (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z
