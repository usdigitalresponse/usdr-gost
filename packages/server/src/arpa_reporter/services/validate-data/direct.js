const {
  directMatches,
  cumulativeAmountIsEqual,
  cumulativeAmountIsLessThanOrEqual,
  dateIsInReportingPeriod,
  dateIsOnOrBefore,
  isAtLeast50K,
  isNumberOrBlank,
  isSum,
  isValidDate,
  isValidSubrecipient,
  matchesFilePart,
  numberIsLessThanOrEqual,
  validateRecords,
  whenGreaterThanZero,
  whenNotBlank
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
    'The direct project id "{}" does not match the project id in the filename'
  ],

  [
    'subrecipient id',
    isValidSubrecipient,
    'Each direct row must have a "subrecipient id" which is included in the "subrecipient" tab'
  ],

  [
    'obligation amount',
    isAtLeast50K,
    'Obligation amount must be at least $50,000',
    { tags: ['v2'] }
  ],

  ['obligation date', isValidDate, 'Obligation date "{}" is not valid'],
  [
    'obligation date',
    dateIsInReportingPeriod,
    'Obligation date "{}" is not in the reporting period',
    { isDateValue: true }
  ],

  [
    'current quarter obligation',
    isNumberOrBlank,
    'Current quarter obligation must be an amount'
  ],
  [
    'current quarter obligation',
    whenNotBlank('current quarter obligation', numberIsLessThanOrEqual('obligation amount')),
    'Current quarter obligation must be less than or equal to obligation amount'
  ],
  [
    'obligation amount',
    cumulativeAmountIsEqual('current quarter obligation', directMatches),
    'Obligation amount must equal cumulative obligation amount',
    { tags: ['cumulative'] }
  ],
  [
    'expenditure start date',
    whenGreaterThanZero('total expenditure amount', isValidDate),
    'Expenditure start date "{}" is not valid',
    { isDateValue: true }
  ],
  [
    'expenditure start date',
    whenGreaterThanZero('total expenditure amount', dateIsInReportingPeriod),
    'Expenditure state date "{}" is not in the reporting period',
    { isDateValue: true }
  ],
  [
    'expenditure start date',
    whenGreaterThanZero(
      'total expenditure amount',
      dateIsOnOrBefore('expenditure end date')
    ),
    'Expenditure start date "{}" is not on or before the expenditure end date',
    { isDateValue: true }
  ],
  [
    'expenditure start date',
    whenGreaterThanZero('total expenditure amount', dateIsInReportingPeriod),
    'Expenditure start date "{}" is not in the reporting period',
    { isDateValue: true }
  ],

  [
    'total expenditure amount',
    isNumberOrBlank,
    'Total expenditure amount must be a number'
  ],
  [
    'total expenditure amount',
    isSum(expenditureCategories),
    'Total expenditure amount is not the sum of all expenditure amount columns'
  ],
  [
    'obligation amount',
    cumulativeAmountIsLessThanOrEqual('total expenditure amount', directMatches),
    'Cumulative expenditure amount must be less than or equal to obligation amount',
    { tags: ['cumulative'] }
  ]
]

module.exports = validateRecords('direct', requiredFields)

// NOTE: This file was copied from src/server/services/validate-data/direct.js (git @ 98c1aa2586) in the arpa-reporter repo on 2022-09-02T05:09:55.179Z
