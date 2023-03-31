const moment = require('moment');
const XLSX = require('xlsx');
const asyncBatch = require('async-batch').default;
const AWS = require('aws-sdk');

const { getPreviousReportingPeriods, getReportingPeriod } = require('../db/reporting-periods');
const { getCurrentReportingPeriodID } = require('../db/settings');
const { recordsForReportingPeriod, mostRecentProjectRecords } = require('../services/records');
const { usedForTreasuryExport } = require('../db/uploads');
const { ARPA_REPORTER_BASE_URL } = require('../environment');
const email = require('../../lib/email');

const SEVEN_DAYS_IN_SECONDS = 604800;

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
        filename: `audit report ${moment().format('yy-MM-DD')}.xlsx`,
        outputWorkBook: XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' }),
    };
}

function getS3Client() {
    /*
        TODO: Move this client generation to a separate module that handles creating all AWS clients.
        Captured in ticket here: https://github.com/usdigitalresponse/usdr-gost/issues/1161
    */

    let s3;
    if (process.env.LOCALSTACK_HOSTNAME) {
        /*
            1. Make sure the local environment has awslocal installed.
            2. Use the commands to create a bucket to test with.
                - awslocal s3api create-bucket --bucket arpa-audit-reports --region us-west-2 --create-bucket-configuration '{"LocationConstraint": "us-west-2"}'
            3. Access bucket resource metadata through the following URL.
                - awslocal s3api list-buckets
                - awslocal s3api list-objects --bucket arpa-audit-reports
        */
        console.log('------------ USING LOCALSTACK ------------');
        const endpoint = new AWS.Endpoint(`http://${process.env.LOCALSTACK_HOSTNAME}:${process.env.EDGE_PORT || 4566}`);
        s3 = new AWS.S3({
            region: process.env.AWS_DEFAULT_REGION || 'us-west-2',
            endpoint,
            s3ForcePathStyle: true,
        });
    } else {
        s3 = new AWS.S3();
    }
    return s3;
}

async function presignAndSendEmail(Key, recipientEmail) {
    const s3 = module.exports.getS3Client();
    // Generate presigned url to get the object
    const signingParams = { Bucket: process.env.AUDIT_REPORT_BUCKET, Key, Expires: SEVEN_DAYS_IN_SECONDS };
    const signedUrl = s3.getSignedUrl('getObject', signingParams);
    // Send email once signed URL is created
    email.sendAuditReportEmail(recipientEmail, signedUrl);
}

async function generateAndSendEmail(requestHost, recipientEmail) {
    // Generate the report
    const report = await module.exports.generate(requestHost);
    // Upload to S3 and generate Signed URL here
    const reportKey = `${report.periodId}/${report.filename}`;
    const handleUpload = (err, data) => {
        if (err) {
            console.log(`Failed to upload audit report ${err}`);
            return;
        }
        console.log(data);
        module.exports.presignAndSendEmail(reportKey, recipientEmail);
    };
    const s3 = module.exports.getS3Client();
    const uploadParams = { Bucket: process.env.AUDIT_REPORT_BUCKET, Key: reportKey, Body: report.outputWorkBook };
    s3.upload(uploadParams, handleUpload);
}

module.exports = {
    generate,
    generateAndSendEmail,
    getS3Client,
    presignAndSendEmail,
};

// NOTE: This file was copied from src/server/lib/audit-report.js (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z
