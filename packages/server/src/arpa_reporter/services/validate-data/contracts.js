const {
  contractMatches,
  cumulativeAmountIsEqual,
  cumulativeAmountIsLessThanOrEqual,
  dateIsInPeriodOfPerformance,
  dateIsInReportingPeriod,
  dateIsOnOrBefore,
  dateIsOnOrBeforeCRFEndDate,
  dropdownIncludes,
  isEqual,
  isAtLeast50K,
  isNotBlank,
  isNumber,
  isNumberOrBlank,
  isPositiveNumberOrZero,
  isSum,
  isValidDate,
  isValidState,
  isValidSubrecipient,
  isValidZip,
  matchesFilePart,
  numberIsLessThanOrEqual,
  validateRecords,
  whenGreaterThanZero,
  whenNotBlank,
  whenUS
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
    'The contract project id "{}" does not match the project id in the filename'
  ],
  [
    'subrecipient id',
    isValidSubrecipient,
    'Each contract row must have a "subrecipient id" which is included in the "subrecipient" tab'
  ],
  [
    'period of performance end date',
    isValidDate,
    'Period of performance end date "{}" is not a valid date',
    { isDateValue: true }
  ],
  [
    'period of performance start date',
    dateIsInPeriodOfPerformance,
    'Period of performance start date "{}" must be in the period of performance',
    { isDateValue: true }
  ],
  [
    'period of performance end date',
    dateIsOnOrBeforeCRFEndDate,
    'Period of performance end date "{}" must be on or before CRF end date',
    { isDateValue: true }
  ],
  ['contract number', isNotBlank, 'Contract number cannot be blank'],
  [
    'contract type',
    dropdownIncludes('contract type'),
    'Contract type is not valid'
  ],
  [
    'contract amount',
    isPositiveNumberOrZero,
    'Contract {{contract number}} contract amount must be an amount greater than or equal to zero'
  ],
  [
    'contract amount',
    isEqual('current quarter obligation'),
    'Contract amount must equal obligation amount',
    { tags: ['v2'] }
  ],
  [
    'contract amount',
    cumulativeAmountIsEqual('current quarter obligation', contractMatches),
    'Contract {{contract number}} contract amount must equal cumulative obligation amount',
    { tags: ['cumulative'] }
  ],
  [
    'contract amount',
    isAtLeast50K,
    'Contract amount must be at least $50,000',
    { tags: ['v2'] }
  ],

  [
    'contract date',
    isValidDate,
    'Contract date "{}" is not valid',
    { isDateValue: true }
  ],
  [
    'contract date',
    dateIsInReportingPeriod,
    'Contract date "{}" is not in reporting report',
    { isDateValue: true }
  ],
  [
    'contract date',
    dateIsInPeriodOfPerformance,
    'Contract date "{}" must be in the period of performance',
    { isDateValue: true }
  ],
  [
    'contract date',
    whenGreaterThanZero(
      'total expenditure amount',
      dateIsOnOrBefore('expenditure start date')
    ),
    'Contract date "{}" must be on or before the expenditure start date',
    { isDateValue: true }
  ],

  [
    'period of performance start date',
    isValidDate,
    'Period of performance start date "{}" is not valid',
    { isDateValue: true }
  ],
  [
    'period of performance start date',
    dateIsOnOrBefore('period of performance end date'),
    'Period of performance start date "{}" must be on or before the period of performance end date',
    { isDateValue: true }
  ],

  [
    'expenditure start date',
    whenGreaterThanZero('total expenditure amount', isValidDate),
    'Expenditure state date "{}" is not a valid date',
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
    'Expenditure start date "{}" must be before expenditure end date',
    { isDateValue: true }
  ],

  [
    'expenditure end date',
    whenGreaterThanZero('total expenditure amount', isValidDate),
    'Expenditure end date "{}" is not a valid date',
    { isDateValue: true }
  ],
  [
    'expenditure end date',
    whenGreaterThanZero('total expenditure amount', dateIsInReportingPeriod),
    'Expenditure end date "{}" must be in the reporting period',
    { isDateValue: true }
  ],

  [
    'primary place of performance address line 1',
    isNotBlank,
    'Primary place of performance address line 1 cannot be blank'
  ],
  [
    'primary place of performance city name',
    isNotBlank,
    'Primary place of performance city name cannot be blank'
  ],
  [
    'primary place of performance state code',
    isValidState,
    'Primary place of performance state code "{}" is not valid'
  ],
  [
    'primary place of performance zip',
    whenUS('primary place of performance country name', isValidZip),
    'Primary place of performance zip "{}" is not valid'
  ],
  [
    'primary place of performance country name',
    dropdownIncludes('country'),
    'Primary place of performance country name "{}" is not valid'
  ],
  [
    'current quarter obligation',
    isNumberOrBlank,

    'Contract {{contract number}} current quarter obligation must be an amount greater than zero'
  ],
  [
    'current quarter obligation',
    whenNotBlank('current quanter obligation', numberIsLessThanOrEqual('contract amount')),
    'Contract {{contract number}} current quarter obligation {{current quarter obligation}} must be less than or equal to the contract amount'
  ],
  [
    'total expenditure amount',
    isNumberOrBlank,
    'Total expenditure amount must be a number'
  ],
  [
    'total expenditure amount',
    isSum(expenditureCategories),
    'Total expenditure amount must be the sum of all expenditure amount columns'
  ],
  [
    'contract amount',
    cumulativeAmountIsLessThanOrEqual('total expenditure amount', contractMatches),
    'Cumulative expenditure amount must be less than or equal to contract amount',
    { tags: ['cumulative'] }
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

module.exports = validateRecords('contracts', requiredFields)

// NOTE: This file was copied from src/server/services/validate-data/contracts.js (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z
