const _ = require('lodash')
const tabValidators = [
  require('./certification'),
  require('./cover')
  // require('./subrecipients'),
  // require('./contracts'),
  // require('./grants'),
  // require('./loans'),
  // require('./transfers'),
  // require('./direct')
]
const { getSubrecipientsHash } = require('./helpers')
const { format } = require('date-fns')

const validateData = (records, fileParts, reportingPeriod, periodSummaries, firstReportingPeriodStartDate) => {
  const groupedRecords = _.groupBy(records, 'type')
  const subrecipientsHash = getSubrecipientsHash(groupedRecords.subrecipient)

  const validateContext = {
    fileParts,
    firstReportingPeriodStartDate: format(firstReportingPeriodStartDate, 'yyyy-MM-dd'),
    reportingPeriod: {
      startDate: format(reportingPeriod.start_date, 'yyyy-MM-dd'),
      endDate: format(reportingPeriod.end_date, 'yyyy-MM-dd'),
      periodOfPerformanceEndDate: format(
        reportingPeriod.period_of_performance_end_date,
        'yyyy-MM-dd'
      ),
      crfEndDate: format(reportingPeriod.crf_end_date, 'yyyy-MM-dd')
    },
    subrecipientsHash,
    tags: reportingPeriod.validation_rule_tags,
    periodSummaries
  }
  return _.flatMap(tabValidators, tabValidator => {
    return _.take(tabValidator(groupedRecords, validateContext), 100)
  })
}

module.exports = { validateData }

// NOTE: This file was copied from src/server/services/validate-data/index.js (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z
