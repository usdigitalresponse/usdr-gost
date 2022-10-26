const moment = require('moment')
const XLSX = require('xlsx')

const { capitalizeFirstLetter, currency, multiselect } = require('./format')
const { getPreviousReportingPeriods, getReportingPeriod } = require('../db/reporting-periods')
const { getCurrentReportingPeriodID } = require('../db/settings')
const { recordsForReportingPeriod, mostRecentProjectRecords } = require('../services/records')
const { log } = require('./log')
const { usedForTreasuryExport } = require('../db/uploads')
const { ARPA_REPORTER_BASE_URL } = require('../environment')

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

  const domain = ARPA_REPORTER_BASE_URL ?? requestHost

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
                row[COLUMN.EC_BUDGET] += record.content.Adopted_Budget__c
                row[COLUMN.EC_TCO] += record.content.Total_Obligations__c
                row[COLUMN.EC_TCE] += record.content.Total_Expenditures__c
                row[COLUMN.EC_CPO] += record.content.Current_Period_Obligations__c
                row[COLUMN.EC_CPE] += record.content.Current_Period_Expenditures__c
                break
              case 'awards50k':
                row[COLUMN.E50K_OBLIGATION] += record.content.Award_Amount__c
                break
              case 'expenditures50k':
                row[COLUMN.E50K_TEA] += record.content.Expenditure_Amount__c
                break
              case 'awards':
                row[COLUMN.E_CPO] += record.content.Quarterly_Obligation_Amt_Aggregates__c
                row[COLUMN.E_CPE] += record.content.Quarterly_Expenditure_Amt_Aggregates__c
                break
            }
            return row
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
      // PROJECT SUMMARIES
      'Project ID': record.content.Project_Identification_Number__c,
      'Upload': getUploadLink(domain, record.upload.id, record.upload.filename),
      'Last Reported': reportingPeriod.name,
      // TODO: consider also mapping project IDs to export templates?
      'Adopted Budget': record.content.Adopted_Budget__c,
      'Total Cumulative Obligations': record.content.Total_Obligations__c,
      'Total Cumulative Expenditures': record.content.Total_Expenditures__c,
      'Current Period Obligations': record.content.Current_Period_Obligations__c,
      'Current Period Expenditures': record.content.Current_Period_Expenditures__c,

      // PROJECT KPIS
      // baseline
      Program_Income_Earned__c: currency(record.content.Program_Income_Earned__c),
      Program_Income_Expended__c: currency(record.content.Program_Income_Expended__c),
      Primary_Project_Demographics__c: record.content.Primary_Project_Demographics__c,
      Primary_Project_Demographics_Explanation__c: record.content.Primary_Project_Demographics_Explanation__c,
      Secondary_Project_Demographics__c: record.content.Secondary_Project_Demographics__c,
      Secondary_Proj_Demographics_Explanation__c: record.content.Secondary_Proj_Demographics_Explanation__c,
      Tertiary_Project_Demographics__c: record.content.Tertiary_Project_Demographics__c,
      Tertiary_Proj_Demographics_Explanation__c: record.content.Tertiary_Proj_Demographics_Explanation__c,
      Structure_Objectives_of_Asst_Programs__c: record.content.Structure_Objectives_of_Asst_Programs__c,
      Recipient_Approach_Description__c: record.content.Recipient_Approach_Description__c,

      // 111210
      Number_Workers_Enrolled_Sectoral__c: record.content.Number_Workers_Enrolled_Sectoral__c,
      Number_Workers_Competing_Sectoral__c: record.content.Number_Workers_Competing_Sectoral__c,
      Number_People_Summer_Youth__c: record.content.Number_People_Summer_Youth__c,

      // 18
      Small_Businesses_Served__c: record.content.Small_Businesses_Served__c,

      // 19
      Number_Non_Profits_Served__c: record.content.Number_Non_Profits_Served__c,

      // 211214
      School_ID_or_District_ID__c: record.content.School_ID_or_District_ID__c,
      Number_Children_Served_Childcare__c: record.content.Number_Children_Served_Childcare__c,
      Number_Families_Served_Home_Visiting__c: record.content.Number_Families_Served_Home_Visiting__c,

      // 2128
      Individuals_Served__c: record.content.Individuals_Served__c,
      Number_Households_Eviction_Prevention__c: record.content.Number_Households_Eviction_Prevention__c,
      Number_Affordable_Housing_Units__c: record.content.Number_Affordable_Housing_Units__c,

      // 215218
      // --

      // 224227
      Number_Students_Tutoring_Programs__c: record.content.Number_Students_Tutoring_Programs__c,

      // 236
      Industry_Experienced_8_Percent_Loss__c: record.content.Industry_Experienced_8_Percent_Loss__c,

      // 31
      Payroll_Public_Health_Safety__c: record.content.Payroll_Public_Health_Safety__c,

      // 32
      Number_of_FTEs_Rehired__c: record.content.Number_of_FTEs_Rehired__c,

      // 4142
      Sectors_Critical_to_Health_Well_Being__c: multiselect(record.content.Sectors_Critical_to_Health_Well_Being__c),
      Workers_Served__c: record.content.Workers_Served__c,
      Premium_Pay_Narrative__c: record.content.Premium_Pay_Narrative__c,
      Number_of_Workers_K_12__c: record.content.Number_of_Workers_K_12__c,

      // 51518
      Proj_Actual_Construction_Start_Date__c: record.content.Proj_Actual_Construction_Start_Date__c,
      Initiation_of_Operations_Date__c: record.content.Initiation_of_Operations_Date__c,
      Location__c: record.content.Location__c,
      Location_Detail__c: record.content.Location_Detail__c,
      National_Pollutant_Discharge_Number__c: record.content.National_Pollutant_Discharge_Number__c,
      Public_Water_System_PWS_ID_number__c: record.content.Public_Water_System_PWS_ID_number__c,
      Median_Household_Income_Service_Area__c: record.content.Median_Household_Income_Service_Area__c,
      Lowest_Quintile_Income__c: currency(record.content.Lowest_Quintile_Income__c),

      // 519521
      Is_project_designed_to_meet_100_mbps__c: capitalizeFirstLetter(record.content.Is_project_designed_to_meet_100_mbps__c),
      Project_not_met_100_mbps_explanation__c: record.content.Project_not_met_100_mbps_explanation__c,
      Is_project_designed_to_exceed_100_mbps__c: capitalizeFirstLetter(record.content.Is_project_designed_to_exceed_100_mbps__c),
      Is_project_designed_provide_hh_service__c: capitalizeFirstLetter(record.content.Is_project_designed_provide_hh_service__c),
      Confirm_Service_Provider__c: record.content.Confirm_Service_Provider__c,
      Technology_Type_Planned__c: record.content.Technology_Type_Planned__c,
      Technology_Type_Planned_Other__c: record.content.Technology_Type_Planned_Other__c,
      Technology_Type_Actual__c: record.content.Technology_Type_Actual__c,
      Technology_Type_Actual_Other__c: record.content.Technology_Type_Actual_Other__c,
      Total_Miles_of_Fiber_Deployed__c: record.content.Total_Miles_of_Fiber_Deployed__c,
      Total_Miles_of_Fiber_Deployed_Actual__c: record.content.Total_Miles_of_Fiber_Deployed_Actual__c,
      Planned_Funded_Locations_Served__c: record.content.Planned_Funded_Locations_Served__c,
      Actual_Funded_Locations_Served__c: record.content.Actual_Funded_Locations_Served__c,
      Planned_Funded_Locations_25_3_Below__c: record.content.Planned_Funded_Locations_25_3_Below__c,
      Planned_Funded_Locations_Between_25_100__c: record.content.Planned_Funded_Locations_Between_25_100__c,
      Planned_Funded_Locations_Minimum_100_100__c: record.content.Planned_Funded_Locations_Minimum_100_100__c,
      Actual_Funded_Locations_Minimum_100_100__c: record.content.Actual_Funded_Locations_Minimum_100_100__c,
      Planned_Funded_Locations_Minimum_100_20__c: record.content.Planned_Funded_Locations_Minimum_100_20__c,
      Actual_Funded_Locations_Minimum_100_20__c: record.content.Actual_Funded_Locations_Minimum_100_20__c,
      Planned_Sum_Speed_Types_Explanation__c: record.content.Planned_Sum_Speed_Types_Explanation__c,
      Actual_Sum_Speed_Types_Explanation__c: record.content.Actual_Sum_Speed_Types_Explanation__c,
      Planned_Funded_Locations_Residential__c: record.content.Planned_Funded_Locations_Residential__c,
      Actual_Funded_Locations_Residential__c: record.content.Actual_Funded_Locations_Residential__c,
      Planned_Funded_Locations_Total_Housing__c: record.content.Planned_Funded_Locations_Total_Housing__c,
      Actual_Funded_Locations_Total_Housing__c: record.content.Actual_Funded_Locations_Total_Housing__c,
      Planned_Funded_Locations_Business__c: record.content.Planned_Funded_Locations_Business__c,
      Actual_Funded_Locations_Business__c: record.content.Actual_Funded_Locations_Business__c,
      Planned_Funded_Locations_Community__c: record.content.Planned_Funded_Locations_Community__c,
      Actual_Funded_Locations_Community__c: record.content.Actual_Funded_Locations_Community__c,
      Planned_Funded_Locations_Explanation__c: record.content.Planned_Funded_Locations_Explanation__c,
      Actual_Funded_Locations_Explanation__c: record.content.Actual_Funded_Locations_Explanation__c,
    }
  })

  return await Promise.all(rows)
}

module.exports = {
  generate
}

// NOTE: This file was copied from src/server/lib/audit-report.js (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z
