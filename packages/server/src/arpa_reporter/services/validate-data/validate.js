const { ValidationItem } = require('../../lib/validation-log')
const { log } = require('../../lib/log')
const { subrecipientKey } = require('./helpers')
const ssf = require('ssf')
const mustache = require('mustache')
const _ = require('lodash')

function dateIsInPeriodOfPerformance (val, content, { reportingPeriod }) {
  const dt = ssf.format('yyyy-MM-dd', val)
  return dt >= '2020-03-01' && dt <= reportingPeriod.periodOfPerformanceEndDate
}

function dateIsInReportingPeriod (val, content, { firstReportingPeriodStartDate, reportingPeriod }) {
  const dt = ssf.format('yyyy-MM-dd', val)
  return dt >= firstReportingPeriodStartDate && dt <= reportingPeriod.endDate
}

function dateIsOnOrBefore (key) {
  return (val, content) => {
    return new Date(val).getTime() <= new Date(content[key]).getTime()
  }
}

function dateIsOnOrBeforeCRFEndDate (val, content, { reportingPeriod }) {
  const dt = ssf.format('yyyy-MM-dd', val)
  return dt <= reportingPeriod.crfEndDate
}

function dateIsOnOrAfter (key) {
  return (val, content) => {
    return new Date(val).getTime() >= new Date(content[key]).getTime()
  }
}

function hasSubrecipientKey (val, content) {
  return !!subrecipientKey(content)
}

function isNotBlank (val) {
  return _.isNumber(val) || !_.isEmpty(val)
}

function isNumber (val) {
  return _.isNumber(val)
}

function isNumberOrBlank (val) {
  return _.isEmpty(val) || _.isNumber(val)
}

function isPositiveNumber (val) {
  return _.isNumber(val) && val > 0
}

function isPositiveNumberOrZero (val) {
  return _.isNumber(val) ? val >= 0 : _.isEmpty(val)
}

function isAtLeast50K (val) {
  return _.isNumber(val) && val >= 50000
}

function isEqual (column) {
  return (val, content) => {
    const f1 = parseFloat(val) || 0.0
    const f2 = parseFloat(content[column]) || 0.0
    return Math.abs(f1 - f2) < 0.01
  }
}

function isSum (columns) {
  return (val, content) => {
    let sum = _.reduce(
      columns,
      (acc, c) => {
        if (!c) {
          return acc
        }
        const f = parseFloat(content[c]) || 0.0
        return acc + f
      },
      0.0
    )
    val = Number(val) || 0 // can come in as a string
    val = _.round(val, 2)
    sum = _.round(sum, 2) // parseFloat returns junk in the 11th decimal place
    if (val !== sum) {
      // console.log(`val is ${val}, sum is ${sum}`);
    }
    return val === sum
  }
}

function periodSummaryKey (key) {
  switch (key) {
    case 'current quarter obligation':
      return 'current_obligation'
    case 'total expenditure amount':
      return 'current_expenditure'
    default:
      return ''
  }
}

function withoutLeadingZeroes (v) {
  return `${v}`.replace(/^0+/, '')
}

function summaryMatches (type, id, content) {
  return (s) => {
    const isMatch = s.award_type === type &&
      withoutLeadingZeroes(s.project_code) === withoutLeadingZeroes(content['project id']) &&
      `${content[id]}` === s.award_number
    // console.log('summary:', s);
    // console.log('content:', content);
    // console.log(s.award_type === type);
    // console.log(withoutLeadingZeroes(s.project_code) === withoutLeadingZeroes(content['project id']));
    // console.log(content[id] === s.award_number);
    return isMatch
  }
}

function contractMatches (content) {
  return summaryMatches('contracts', 'contract number', content)
}

function directMatches (content) {
  return s => {
    const awardNumber = `${content['subrecipient id']}:${content['obligation date']}`
    const isMatch = s.award_type === 'direct' &&
      withoutLeadingZeroes(s.project_code) === withoutLeadingZeroes(content['project id']) &&
      awardNumber === s.award_number
    return isMatch
  }
}

function grantMatches (content) {
  return summaryMatches('grants', 'award number', content)
}

function loanMatches (content) {
  return summaryMatches('loans', 'loan number', content)
}

function transferMatches (content) {
  return summaryMatches('transfers', 'transfer number', content)
}

function cumulativeAmount (key, content, periodSummaries, filterPredicate) {
  const summaries = _.get(periodSummaries, 'periodSummaries')
  return _.chain(summaries)
    .filter(filterPredicate(content))
    .map(periodSummaryKey(key))
    .reduce((acc, s) => acc + Number(s) || 0.0, 0.0)
    .value()
}

function cumulativeAmountIsEqual (key, filterPredicate) {
  return (val, content, { periodSummaries }) => {
    const currentPeriodAmount = Number(content[key]) || 0.0
    const previousPeriodsAmount = cumulativeAmount(key, content, periodSummaries, filterPredicate)
    const b = _.round(val, 2) === _.round(currentPeriodAmount + previousPeriodsAmount, 2)
    if (!b) {
      log('validate.js/cumulativeAmountIsEqual():',
        key,
        val,
        'current:', currentPeriodAmount,
        'previous:', previousPeriodsAmount,
        'total:', currentPeriodAmount + previousPeriodsAmount)
      log('content:')
      log(JSON.stringify(content))
    }
    return b
  }
}

function cumulativeAmountIsLessThanOrEqual (key, filterPredicate) {
  return (val, content, { periodSummaries }) => {
    const currentPeriodAmount = Number(content[key]) || 0.0
    const previousPeriodsAmount = cumulativeAmount(key, content, periodSummaries, filterPredicate)
    const b = _.round(currentPeriodAmount + previousPeriodsAmount, 2) <= _.round(val, 2)
    if (!b) {
      console.log('cumulativeAmountIsLessThanOrEqual:',
        key,
        val,
        'current:', currentPeriodAmount,
        'previous:', previousPeriodsAmount,
        'total:', currentPeriodAmount + previousPeriodsAmount)
      console.log('content:', JSON.stringify(content))
    }
    return b
  }
}

function isValidDate (val) {
  return !_.isNaN(new Date(val).getTime())
}

function isValidSubrecipient (val, content, { subrecipientsHash }) {
  return _.has(subrecipientsHash, val)
}

function isUnitedStates (value) {
  return value === 'usa' || value === 'united states'
}

function isValidState (val, content) {
  log(`isValidState(${val})`)
  return (
    dropdownIncludes('state code')(val)
  )
}

function isValidZip (val, content) {
  return /^\d{5}(-\d{4})?$/.test(`${val}`)
}

function matchesFilePart (key) {
  return function (val, content, { fileParts }) {
    const fileValue = fileParts[key].replace(/^0*/, '')
    const documentValue = (val || '').toString().replace(/^0*/, '')
    return documentValue === fileValue
  }
}

function numberIsLessThanOrEqual (key) {
  return (val, content) => {
    const other = _.isNumber(content[key]) ? content[key] : 0.00
    const b = _.isNumber(val) && _.isNumber(other) && val <= other
    if (!b) {
      console.log('numberIsLessThanOrEqual fails:', key, val, _.isNumber(val), other, _.isNumber(other), val <= other)
    }
    return b
  }
}

function numberIsGreaterThanOrEqual (key) {
  return (val, content) => {
    const other = _.isNumber(content[key]) ? content[key] : 0.00
    return _.isNumber(val) && _.isNumber(other) && val >= other
  }
}

function dropdownIncludes (key) {
  // TODO: re-write this
  return val => true
}

function whenBlank (key, validator) {
  return (val, content, context) => {
    return !!content[key] || validator(val, content, context)
  }
}

function whenNotBlank (key, validator) {
  return (val, content, context) => {
    return !content[key] || validator(val, content, context)
  }
}

function whenUS (key, validator) {
  return (val, content, context) => {
    return !isUnitedStates(content[key]) ||
      validator(val, content, context)
  }
}

function whenGreaterThanZero (key, validator) {
  return (val, content, context) => {
    return content[key] > 0 ? validator(val, content, context) : true
  }
}

function addValueToMessage (message, value, content) {
  const s = message.replace('{}', `${value || ''}`)
  return mustache.render(s, content)
}

function messageValue (val, options) {
  if (options && options.isDateValue && val) {
    const dt = new Date(val).getTime()
    return _.isNaN(dt) ? val : ssf.format('MM/dd/yyyy', val)
  }
  return val
}

function includeValidator (options, context) {
  const tags = _.get(options, 'tags')
  if (!tags) {
    return true
  }
  if (!context.tags) {
    return false
  }
  return !_.isEmpty(_.intersection(tags, context.tags))
}

function validateFields (requiredFields, content, tab, row, context = {}) {
  // console.log("------ required fields are:");
  // console.dir(requiredFields);
  // console.log("------content is");
  // console.dir(content);
  // console.log("------content end");
  const valog = []
  requiredFields.forEach(([key, validator, message, options]) => {
    if (includeValidator(options, context)) {
      const val = content[key] || ''
      if (!validator(val, content, context)) {
        // console.log(`val ${val}, content:`);
        // console.dir(content);
        // console.log(`val ${val}, context:`);
        // console.dir(context);
        const finalMessage = addValueToMessage(
          message || `Empty or invalid entry for ${key}: "{}"`,
          messageValue(val, options),
          content
        )
        console.log(finalMessage)
        valog.push(
          new ValidationItem({
            message: finalMessage,
            tab,
            row
          })
        )
      }
    }
  })
  return valog
}

function validateRecords (tab, validations) {
  return function (groupedRecords, validateContext) {
    const records = groupedRecords[tab]
    return _.flatMap(records, ({ content, sourceRow }) => {
      return validateFields(
        validations,
        content,
        tab,
        sourceRow,
        validateContext
      )
    })
  }
}

function validateSingleRecord (tab, validations, message) {
  return function (groupedRecords, validateContext) {
    const records = groupedRecords[tab]
    let valog = []

    if (records && records.length === 1) {
      const { content } = records[0]
      const row = 2
      const results = validateFields(validations, content, tab, row, validateContext)
      valog = valog.concat(results)
    } else {
      valog.push(new ValidationItem({ message, tab }))
    }
    return valog
  }
}

module.exports = {
  contractMatches,
  cumulativeAmountIsEqual,
  cumulativeAmountIsLessThanOrEqual,
  dateIsInPeriodOfPerformance,
  dateIsInReportingPeriod,
  dateIsOnOrBefore,
  dateIsOnOrBeforeCRFEndDate,
  dateIsOnOrAfter,
  directMatches,
  grantMatches,
  dropdownIncludes,
  hasSubrecipientKey,
  isEqual,
  isAtLeast50K,
  isNotBlank,
  isNumber,
  isNumberOrBlank,
  isPositiveNumber,
  isPositiveNumberOrZero,
  isSum,
  isValidDate,
  isValidState,
  isValidSubrecipient,
  isValidZip,
  loanMatches,
  matchesFilePart,
  messageValue,
  numberIsLessThanOrEqual,
  numberIsGreaterThanOrEqual,
  transferMatches,
  validateRecords,
  validateFields,
  validateSingleRecord,
  whenBlank,
  whenGreaterThanZero,
  whenNotBlank,
  whenUS
}

// NOTE: This file was copied from src/server/services/validate-data/validate.js (git @ 98c1aa2586) in the arpa-reporter repo on 2022-09-02T05:09:55.179Z
