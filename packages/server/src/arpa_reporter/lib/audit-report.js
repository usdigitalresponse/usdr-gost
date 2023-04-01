const moment = require('moment');
const XLSX = require('xlsx');
const asyncBatch = require('async-batch').default;
const aws = require('./aws-client');

const { getPreviousReportingPeriods, getReportingPeriod } = require('../db/reporting-periods');
const { getCurrentReportingPeriodID } = require('../db/settings');
const { recordsForReportingPeriod, mostRecentProjectRecords } = require('../services/records');
const { usedForTreasuryExport } = require('../db/uploads');
const { ARPA_REPORTER_BASE_URL } = require('../environment');
const email = require('../../lib/email');
const { useTenantId } = require('../use-request');

const COLUMN = {
    EC_BUDGET: 'Adopted Budget (EC tabs)',
    EC_TCO: 'Total Cumulative Obligations (EC tabs)',
    EC_TCE: 'Total Cumulative Expenditures (EC tabs)',
    EC_CPO: 'Current Period Obligations (EC tabs)',
    EC_CPE: 'Current Period Expenditures (EC tabs)',
    E50K_OBLIGATION: 'Subaward Obligations (Subaward >50k)',
    E50K_TEA: 'Total Expenditure Amount (Expenditures >50k)',
    E_CPO: 'Current Period Obligations (Aggregate Awards <50k)',
    E_CPE: 'Current Period Expenditures (Aggregate Awards <50k)',
};

function getUploadLink(domain, id, filename) {
    return { f: `=HYPERLINK("${domain}/uploads/${id}","${filename}")` };
}

async function getAggregatePerUpload(data) {
    const {
        upload, period, domain, records,
    } = data;
    const emptyRow = {
        'Reporting Period': period.name,
        'Period End Date': new Date(period.end_date),
        Upload: getUploadLink(domain, upload.id, upload.filename),
        [COLUMN.EC_BUDGET]: 0,
        [COLUMN.EC_TCO]: 0,
        [COLUMN.EC_TCE]: 0,
        [COLUMN.EC_CPO]: 0,
        [COLUMN.EC_CPE]: 0,
        [COLUMN.E50K_OBLIGATION]: 0,
        [COLUMN.E50K_TEA]: 0,
        [COLUMN.E_CPO]: 0,
        [COLUMN.E_CPE]: 0,
    };

    const row = records
        .filter((record) => record.upload.id === upload.id)
        .reduce((newRow, record) => {
            switch (record.type) {
                case 'ec1':
                case 'ec2':
                case 'ec3':
                case 'ec4':
                case 'ec5':
                case 'ec7':
                    newRow[COLUMN.EC_BUDGET] += record.content.Adopted_Budget__c;
                    newRow[COLUMN.EC_TCO] += record.content.Total_Obligations__c;
                    newRow[COLUMN.EC_TCE] += record.content.Total_Expenditures__c;
                    newRow[COLUMN.EC_CPO] += record.content.Current_Period_Obligations__c;
                    newRow[COLUMN.EC_CPE] += record.content.Current_Period_Expenditures__c;
                    break;
                case 'awards50k':
                    newRow[COLUMN.E50K_OBLIGATION] += record.content.Award_Amount__c;
                    break;
                case 'expenditures50k':
                    newRow[COLUMN.E50K_TEA] += record.content.Expenditure_Amount__c;
                    break;
                case 'awards':
                    newRow[COLUMN.E_CPO] += record.content.Quarterly_Obligation_Amt_Aggregates__c;
                    newRow[COLUMN.E_CPE] += record.content.Quarterly_Expenditure_Amt_Aggregates__c;
                    break;
                default:
            }
            return newRow;
        }, emptyRow);

    return row;
}

async function getProjectSummaryRow(data) {
    const { record, domain } = data;
    const reportingPeriod = await getReportingPeriod(record.upload.reporting_period_id);

    return {
        'Project ID': record.content.Project_Identification_Number__c,
        Upload: getUploadLink(domain, record.upload.id, record.upload.filename),
        'Last Reported': reportingPeriod.name,
        // TODO: consider also mapping project IDs to export templates?
        'Adopted Budget': record.content.Adopted_Budget__c,
        'Total Cumulative Obligations': record.content.Total_Obligations__c,
        'Total Cumulative Expenditures': record.content.Total_Expenditures__c,
        'Current Period Obligations': record.content.Current_Period_Obligations__c,
        'Current Period Expenditures': record.content.Current_Period_Expenditures__c,
        'Completion Status': record.content.Completion_Status__c,
    };
}

async function getAggregatePeriodRow(data) {
    const { period, domain } = data;
    const uploads = await usedForTreasuryExport(period.id);
    const records = await recordsForReportingPeriod(period.id);

    const inputs = [];
    uploads.forEach((u) => inputs.push({
        upload: u, period, domain, records,
    }));

    return asyncBatch(inputs, getAggregatePerUpload, 2);
}

async function createObligationSheet(periodId, domain) {
    // select active reporting periods and sort by date
    const reportingPeriods = await getPreviousReportingPeriods(periodId);
    const inputs = [];
    reportingPeriods.forEach((r) => inputs.push({ period: r, domain }));

    // collect aggregate obligations and expenditures by upload
    const rows = await asyncBatch(inputs, getAggregatePeriodRow, 2);
    return rows.flat();
}

async function createProjectSummaries(periodId, domain) {
    const records = await mostRecentProjectRecords(periodId);

    const inputs = [];
    records.forEach((r) => inputs.push({ record: r, domain }));

    const rows = await asyncBatch(inputs, getProjectSummaryRow, 2);

    return rows;
}

async function generate(requestHost) {
    const periodId = await getCurrentReportingPeriodID();
    console.log(`generate(${periodId})`);

    const domain = ARPA_REPORTER_BASE_URL ?? requestHost;

    // generate sheets
    const [
        obligations,
        projectSummaries,
    ] = await Promise.all([
        createObligationSheet(periodId, domain),
        createProjectSummaries(periodId, domain),
    ]);

    // compose workbook
    const sheet1 = XLSX.utils.json_to_sheet(obligations, { dateNF: 'MM/DD/YYYY' });
    const sheet2 = XLSX.utils.json_to_sheet(projectSummaries, { dateNF: 'MM/DD/YYYY' });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet1, 'Obligations & Expenditures');
    XLSX.utils.book_append_sheet(workbook, sheet2, 'Project Summaries');

    return {
        periodId,
        filename: `audit-report-${moment().format('yy-MM-DD')}.xlsx`,
        outputWorkBook: XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' }),
    };
}

async function sendEmailWithLink(periodId, filename, recipientEmail) {
    const url = `${process.env.WEBSITE_DOMAIN}/api/audit_report/${periodId}/${filename}`;
    email.sendAuditReportEmail(recipientEmail, url);
}

async function generateAndSendEmail(requestHost, recipientEmail) {
    const tenantId = useTenantId();
    // Generate the report
    const report = await module.exports.generate(requestHost);
    // Upload to S3 and send email link
    const reportKey = `${tenantId}/${report.periodId}/${report.filename}`;
    const handleUpload = (err, data) => {
        if (err) {
            console.log(`Failed to upload audit report ${err}`);
            return;
        }
        console.log(data);
        module.exports.sendEmailWithLink(report.periodId, report.filename, recipientEmail);
    };
    const s3 = aws.getS3Client();
    const uploadParams = {
        Bucket: process.env.AUDIT_REPORT_BUCKET,
        Key: reportKey,
        Body: report.outputWorkBook,
        ServerSideEncryption: 'AES256',
    };
    s3.upload(uploadParams, handleUpload);
}

module.exports = {
    generate,
    generateAndSendEmail,
    sendEmailWithLink,
};

// NOTE: This file was copied from src/server/lib/audit-report.js (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z
