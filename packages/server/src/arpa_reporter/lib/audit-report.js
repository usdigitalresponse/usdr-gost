const moment = require('moment')
const XLSX = require('xlsx')

const { getPreviousReportingPeriods, getReportingPeriod } = require('../db/reporting-periods')
const { getCurrentReportingPeriodID } = require('../db/settings')
const { recordsForReportingPeriod, mostRecentProjectRecords } = require('../services/records')
const { log } = require('./log')
const { usedForTreasuryExport } = require('../db/uploads')
const { WEBSITE_DOMAIN } = require('../environment')

const COLUMN = {
  EC_BUDGET: 'Adopted Budget (EC tabs)',
  EC_TCO: 'Total Cumulative Obligations (EC tabs)',
  EC_TCE: 'Total Cumulative Expenditures (EC tabs)',
  EC_CPO: 'Current Period Obligations (EC tabs)',
  EC_CPE: 'Current Period Expenditures (EC tabs)',
  E50K_OBLIGATION: 'Subaward Obligations (Subaward >50k)',
  E50K_TEA: 'Total Expenditure Amount (Expenditures >50k)',
  E_CPO: 'Current Period Obligations (Aggregate Awards <50k)',
  E_CPE: 'Current Period Expenditures (Aggregate Awards <50k)'
}

function getUploadLink (domain, id, filename) {
  return { f: `=HYPERLINK("${domain}/uploads/${id}","${filename}")` }
}

async function generate (requestHost) {
  const periodId = await getCurrentReportingPeriodID()
  log(`generate(${periodId})`)

  const domain = WEBSITE_DOMAIN ?? requestHost

  // generate sheets
  const [
    obligations,
    projectSummaries
  ] = await Promise.all([
    createObligationSheet(periodId, domain),
    createProjectSummaries(periodId, domain)
  ])

  // compose workbook
  const sheet1 = XLSX.utils.json_to_sheet(obligations, { dateNF: 'MM/DD/YYYY' })
  const sheet2 = XLSX.utils.json_to_sheet(projectSummaries, { dateNF: 'MM/DD/YYYY' })
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet1, 'Obligations & Expenditures')
  XLSX.utils.book_append_sheet(workbook, sheet2, 'Project Summaries')

  return {
    filename: `audit report ${moment().format('yy-MM-DD')}.xlsx`,
    outputWorkBook: XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' })
  }
}

async function createObligationSheet (periodId, domain) {
  // select active reporting periods and sort by date
  const reportingPeriods = await getPreviousReportingPeriods(periodId)

  // collect aggregate obligations and expenditures by upload
  const rows = await Promise.all(
    reportingPeriods.map(async period => {
      const uploads = await usedForTreasuryExport(period.id)
      const records = await recordsForReportingPeriod(period.id)

      return await Promise.all(uploads.map(async upload => {
        const emptyRow = {
          'Reporting Period': period.name,
          'Period End Date': new Date(period.end_date),
          'Upload': getUploadLink(domain, upload.id, upload.filename),
          [COLUMN.EC_BUDGET]: 0,
          [COLUMN.EC_TCO]: 0,
          [COLUMN.EC_TCE]: 0,
          [COLUMN.EC_CPO]: 0,
          [COLUMN.EC_CPE]: 0,
          [COLUMN.E50K_OBLIGATION]: 0,
          [COLUMN.E50K_TEA]: 0,
          [COLUMN.E_CPO]: 0,
          [COLUMN.E_CPE]: 0
        }

        const row = records
          .filter(record => record.upload.id === upload.id)
          .reduce((row, record) => {
            switch (record.type) {
              case 'ec1':
              case 'ec2':
              case 'ec3':
              case 'ec4':
              case 'ec5':
              case 'ec7':
                return {
                  ...row,
                  [COLUMN.EC_BUDGET]:
                    row[COLUMN.EC_BUDGET] + record.content.Adopted_Budget__c,
                  [COLUMN.EC_TCO]:
                    row[COLUMN.EC_TCO] + record.content.Total_Obligations__c,
                  [COLUMN.EC_TCE]:
                    row[COLUMN.EC_TCE] + record.content.Total_Expenditures__c,
                  [COLUMN.EC_CPO]:
                    row[COLUMN.EC_CPO] +
                    record.content.Current_Period_Obligations__c,
                  [COLUMN.EC_CPE]:
                    row[COLUMN.EC_CPE] +
                    record.content.Current_Period_Expenditures__c
                }
              case 'awards50k':
                return {
                  ...row,
                  [COLUMN.E50K_OBLIGATION]:
                    row[COLUMN.E50K_OBLIGATION] + record.content.Award_Amount__c
                }
              case 'expenditures50k':
                return {
                  ...row,
                  [COLUMN.E50K_TEA]:
                    row[COLUMN.E50K_TEA] + record.content.Expenditure_Amount__c
                }
              case 'awards':
                return {
                  ...row,
                  [COLUMN.E_CPO]:
                    row[COLUMN.E_CPO] +
                    record.content.Quarterly_Obligation_Amt_Aggregates__c,
                  [COLUMN.E_CPE]:
                    row[COLUMN.E_CPE] +
                    record.content.Quarterly_Expenditure_Amt_Aggregates__c
                }
              default:
                return row
            }
          }, emptyRow)

        return row
      }))
    })
  )

  return rows.flat()
}

async function createProjectSummaries (periodId, domain) {
  const records = await mostRecentProjectRecords(periodId)

  const rows = records.map(async record => {
    const reportingPeriod = await getReportingPeriod(record.upload.reporting_period_id)

    return {
      'Project ID': record.content.Project_Identification_Number__c,
      'Upload': getUploadLink(domain, record.upload.id, record.upload.filename),
      'Last Reported': reportingPeriod.name,
      // TODO: consider also mapping project IDs to export templates?
      'Adopted Budget': record.content.Adopted_Budget__c,
      'Total Cumulative Obligations': record.content.Total_Obligations__c,
      'Total Cumulative Expenditures': record.content.Total_Expenditures__c,
      'Current Period Obligations': record.content.Current_Period_Obligations__c,
      'Current Period Expenditures': record.content.Current_Period_Expenditures__c
    }
  })

  return await Promise.all(rows)
}

module.exports = {
  generate
}

// NOTE: This file was copied from src/server/lib/audit-report.js (git @ 98c1aa2586) in the arpa-reporter repo on 2022-09-02T05:09:55.179Z
