const tracer = require('dd-trace');
const ps = require('node:process');
const moment = require('moment');
const { v4 } = require('uuid');
const XLSX = require('xlsx');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const aws = require('../../lib/gost-aws');
const { ec } = require('./format');

const { getPreviousReportingPeriods, getReportingPeriod, getAllReportingPeriods } = require('../db/reporting-periods');
const { getCurrentReportingPeriodID } = require('../db/settings');
const { recordsForProject, recordsForReportingPeriod, mostRecentProjectRecords } = require('../services/records');
const { usedForTreasuryExport } = require('../db/uploads');
const { ARPA_REPORTER_BASE_URL } = require('../environment');
const email = require('../../lib/email');
const { useTenantId } = require('../use-request');

const log = (() => {
    const stickyData = {};
    return (msg, extra, sticky, clear) => {
        if (clear === true) {
            for (const k in sticky) {
                delete sticky[k];
            }
        }
        extra = extra || {};
        for (const k in sticky || {}) {
            stickyData[k] = sticky[k];
        }
        for (const k in stickyData) {
            extra[k] = stickyData[k];
        }
        const processStats = { memory: ps.memoryUsage(), cpu: ps.cpuUsage() };
        console.log(JSON.stringify({
            usage: 'ARPA investigation', level: 'debug', msg, extra, processStats,
        }));
    };
})();

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

async function createObligationSheet(periodId, domain) {
    // select active reporting periods and sort by date
    const reportingPeriods = await getPreviousReportingPeriods(periodId);

    const rows = await Promise.all(
        reportingPeriods.map(async (period) => {
            const uploads = await usedForTreasuryExport(period.id);
            const records = await recordsForReportingPeriod(period.id);

            return Promise.all(uploads.map((upload) => {
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
                            // pass
                        }
                        return newRow;
                    }, emptyRow);

                return row;
            }));
        }),
    );

    return rows.flat();
}

async function createProjectSummaries(periodId, domain) {
    const records = await mostRecentProjectRecords(periodId);

    const inputs = [];
    records.forEach((r) => inputs.push({ record: r, domain }));

    const rows = records.map(async (record) => {
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
    });

    return Promise.all(rows);
}

function getRecordsByProject(records) {
    return records.reduce((groupByProject, item) => {
        const project = item.content.Project_Identification_Number__c;
        const group = (groupByProject[project] || []);
        group.push(item);
        groupByProject[project] = group;
        return groupByProject;
    }, {});
}

async function createReportsGroupedByProject(periodId) {
    const records = await recordsForProject(periodId);
    const recordsByProject = getRecordsByProject(records);
    const reportingPeriods = await getAllReportingPeriods();

    return Object.entries(recordsByProject).map(([projectId, projectRecords]) => {
        const record = projectRecords[0];

        // set values for columns that are common across all records of projectId
        const row = {
            'Project ID': projectId,
            'Project Description': record.content.Project_Description__c,
            'Project Expenditure Category Group': ec(record.type),
            'Project Expenditure Category': record.subcategory,
        };

        // get all reporting periods related to the project
        const allReportingPeriods = Array.from(new Set(projectRecords.map((r) => r.upload.reporting_period_id)));

        // initialize the columns in the row
        allReportingPeriods.forEach((reportingPeriodId) => {
            const reportingPeriodEndDate = reportingPeriods.filter((reportingPeriod) => reportingPeriod.id === reportingPeriodId)[0].end_date;
            [
                `${reportingPeriodEndDate} Total Aggregate Expenditures`,
                `${reportingPeriodEndDate} Total Expenditures for Awards Greater or Equal to $50k`,
                `${reportingPeriodEndDate} Total Aggregate Obligations`,
                `${reportingPeriodEndDate} Total Obligations for Awards Greater or Equal to $50k`,
            ].forEach((columnName) => { row[columnName] = 0; });
        });

        row['Capital Expenditure Amount'] = 0;

        // set values in each column
        projectRecords.forEach((r) => {
            // for project summaries v2 report
            const reportingPeriodEndDate = reportingPeriods.filter((reportingPeriod) => r.upload.reporting_period_id === reportingPeriod.id)[0].end_date;
            row[`${reportingPeriodEndDate} Total Aggregate Expenditures`] += (r.content.Total_Expenditures__c || 0);
            row[`${reportingPeriodEndDate} Total Aggregate Obligations`] += (r.content.Total_Obligations__c || 0);
            row[`${reportingPeriodEndDate} Total Obligations for Awards Greater or Equal to $50k`] += (r.content.Award_Amount__c || 0);
            row[`${reportingPeriodEndDate} Total Expenditures for Awards Greater or Equal to $50k`] += (r.content.Expenditure_Amount__c || 0);
            row['Capital Expenditure Amount'] += (r.content.Total_Cost_Capital_Expenditure__c || 0);
        });

        return row;
    });
}

async function createKpiDataGroupedByProject(periodId) {
    const records = await recordsForProject(periodId);
    const recordsByProject = getRecordsByProject(records);

    return Object.entries(recordsByProject).map(([projectId, projectRecords]) => {
        const row = {
            'Project ID': projectId,
            'Number of Subawards': 0,
            'Number of Expenditures': 0,
            'Evidence Based Total Spend': 0,
        };

        projectRecords.forEach((r) => {
            const currentPeriodExpenditure = r.content.Current_Period_Expenditures__c || 0;
            row['Number of Subawards'] += (r.type === 'awards50k');
            row['Number of Expenditures'] += (currentPeriodExpenditure > 0);
            row['Evidence Based Total Spend'] += (r.content.Spending_Allocated_Toward_Evidence_Based_Interventions || 0);
        });

        return row;
    });
}

async function generate(requestHost) {
    log('called generate()');
    return tracer.trace('generate()', async () => {
        const periodId = await getCurrentReportingPeriodID();
        log('got reporting period ID', {}, { periodId });
        console.log(`generate(${periodId})`);

        const domain = ARPA_REPORTER_BASE_URL ?? requestHost;
        log('determined domain', {}, { domain });

        // generate sheets
        log('generating sheets');
        const [
            obligations,
            projectSummaries,
            projectSummaryGroupedByProject,
            KPIDataGroupedByProject,
        ] = await Promise.all([
            createObligationSheet(periodId, domain),
            createProjectSummaries(periodId, domain),
            createReportsGroupedByProject(periodId),
            createKpiDataGroupedByProject(periodId),
        ]);
        log('finished generating sheets');
        log('composing workbook');
        const workbook = tracer.trace('compose-workbook', () => {
            // compose workbook
            const sheet1 = XLSX.utils.json_to_sheet(obligations, { dateNF: 'MM/DD/YYYY' });
            log('sheet 1 complete');
            const sheet2 = XLSX.utils.json_to_sheet(projectSummaries, { dateNF: 'MM/DD/YYYY' });
            log('sheet 2 complete');
            const sheet3 = XLSX.utils.json_to_sheet(projectSummaryGroupedByProject, { dateNF: 'MM/DD/YYYY' });
            log('sheet 3 complete');
            const sheet4 = XLSX.utils.json_to_sheet(KPIDataGroupedByProject, { dateNF: 'MM/DD/YYYY' });
            log('sheet 4 complete');
            log('making new workbook');
            const newWorkbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(newWorkbook, sheet1, 'Obligations & Expenditures');
            log('added sheet 1 to workbook');
            XLSX.utils.book_append_sheet(newWorkbook, sheet2, 'Project Summaries');
            log('added sheet 2 to workbook');
            XLSX.utils.book_append_sheet(newWorkbook, sheet3, 'Project Summaries V2');
            log('added sheet 3 to workbook');
            XLSX.utils.book_append_sheet(newWorkbook, sheet4, 'KPI');
            log('added sheet 4 to workbook');
            log('returning workbook');
            return newWorkbook;
        });

        log('calling XLSX.write()');
        const outputWorkBook = tracer.trace('XLSX.write', () => XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' }));
        log('XLSX.write() finished');

        const filename = `audit-report-${moment().format('yy-MM-DD')}-${v4()}.xlsx`;
        log('generate() returning', {}, { generatedFilename: filename });
        return {
            periodId,
            filename,
            outputWorkBook,
        };
    });
}

async function sendEmailWithLink(fileKey, recipientEmail) {
    const url = `${process.env.API_DOMAIN}/api/audit_report/${fileKey}`;
    email.sendAsyncReportEmail(recipientEmail, url, email.ASYNC_REPORT_TYPES.audit);
}

async function generateAndSendEmail(requestHost, recipientEmail) {
    log('generateAndSendEmail() called', null, null, true);
    const tenantId = useTenantId();
    // Generate the report
    log('Generating the report', {}, { tenantId });
    const report = await module.exports.generate(requestHost);
    log('Report generation complete', {});
    // Upload to S3 and send email link
    const reportKey = `${tenantId}/${report.periodId}/${report.filename}`;
    log('Created report key', null, { reportKey });

    const s3 = aws.getS3Client();
    log('preparing upload');
    const uploadParams = {
        Bucket: process.env.AUDIT_REPORT_BUCKET,
        Key: reportKey,
        Body: report.outputWorkBook,
        ServerSideEncryption: 'AES256',
    };
    try {
        console.log(uploadParams);
        log('uploading report', { uploadParams });
        await s3.send(new PutObjectCommand(uploadParams));
        await module.exports.sendEmailWithLink(reportKey, recipientEmail);
    } catch (err) {
        console.log(`Failed to upload/email audit report ${err}`);
    }
    log('generateAndSendEmail() complete', null, null, true);
}

module.exports = {
    generate,
    generateAndSendEmail,
    sendEmailWithLink,
};

// NOTE: This file was copied from src/server/lib/audit-report.js (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z
