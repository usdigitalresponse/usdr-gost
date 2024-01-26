const tracer = require('dd-trace');
const ps = require('node:process');
const moment = require('moment');
const { v4 } = require('uuid');
const XLSX = require('xlsx');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const { log } = require('../../lib/logging');
const aws = require('../../lib/gost-aws');
const { ec } = require('./format');

const { getPreviousReportingPeriods, getAllReportingPeriods } = require('../db/reporting-periods');
const { getCurrentReportingPeriodID } = require('../db/settings');
const {
    recordsForProject, recordsForReportingPeriod, recordsForUpload, EC_SHEET_TYPES,
} = require('../services/records');
const { usedForTreasuryExport } = require('../db/uploads');
const { ARPA_REPORTER_BASE_URL } = require('../environment');
const email = require('../../lib/email');
const { useTenantId } = require('../use-request');
const { getUser, knex } = require('../../db');

const REPORTING_DATE_FORMAT = 'MM-DD-yyyy';
const REPORTING_DATE_REGEX = /^(\d{2}-\d{2}-\d{4}) /;

/**
 * Modifies logger and returns a new child that injects a processStats object into all logs
 * by default. Individual logging calls (or child loggers of the returned logger) can disable
 * this behavior by passing an options object with { processStats: false }.
 *
 * Note that the returned logger will always overwrite a log with "processStats" in the options,
 * so don't plan on using that field name for anything else.
 */
const processStatsLogger = (logger = log.child(), options = {}) => {
    logger.addSerializers({
        processStats: (enabled) => {
            if (enabled) {
                return { memory: ps.memoryUsage(), cpu: ps.cpuUsage() };
            }
            return undefined;
        },
    });
    return logger.child({ processStats: true, ...options });
};

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

async function createObligationSheet(periodId, domain, tenantId, logger = log) {
    logger.info('building rows for spreadsheet');
    // select active reporting periods and sort by date
    const reportingPeriods = await getPreviousReportingPeriods(periodId, undefined, tenantId);
    logger.fields.sheet.totalReportingPeriods = reportingPeriods.length;
    logger.info('retrieved previous reporting periods');

    const rows = (await Promise.all(reportingPeriods.map(async (period) => {
        const periodLogger = logger.child({
            period: { id: period.id, startDate: period.start_date, endDate: period.end_date },
        });
        periodLogger.debug('populating rows for reporting period');
        const uploads = await usedForTreasuryExport(period.id, tenantId);
        periodLogger.fields.period.totalUploads = uploads.length;
        periodLogger.info('retrieved uploads for reporting period');
        const records = await recordsForReportingPeriod(period.id, tenantId);
        periodLogger.fields.period.totalRecords = records.length;
        periodLogger.info('retrieved records for reporting period');

        return uploads.map((upload) => {
            const uploadLogger = periodLogger.child({ upload: { id: upload.id } });
            uploadLogger.debug('populating row from upload in reporting period');
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
                    uploadLogger.debug({ record: { type: record.type } },
                        'populating row from record in upload');
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

            uploadLogger.info('finished populating row');
            return row;
        });
    }))).flat();

    logger.fields.sheet.rowCount = rows.length;
    logger.info('finished building rows for spreadsheet');
    return rows;
}

async function createProjectSummaries(periodId, domain, tenantId, logger = log) {
    logger.info('building rows for spreadsheet');
    const uploads = await knex('uploads')
        .select({
            id: 'uploads.id',
            filename: 'uploads.filename',
            tenant_id: 'uploads.tenant_id',
            reporting_period_id: 'uploads.reporting_period_id',
            reporting_period_name: 'reporting_periods.name',
            reporting_period_end_date: 'reporting_periods.end_date',
        })
        .with('include_reporting_periods', knex('reporting_periods')
            .select('id')
            .where({ tenant_id: tenantId })
            .where('end_date', '<=', knex('reporting_periods').select('end_date').where({ id: periodId })))
        .with('agency_max_val', knex('uploads')
            .select('agency_id', 'ec_code', 'reporting_period_id').max('created_at as most_recent')
            .join('include_reporting_periods', { reporting_period_id: 'include_reporting_periods.id' })
            .where({ tenant_id: tenantId, invalidated_at: null })
            .whereNotNull('validated_at')
            .groupBy('agency_id', 'ec_code', 'reporting_period_id'))
        .innerJoin('agency_max_val', {
            'uploads.created_at': 'agency_max_val.most_recent',
            'uploads.ec_code': 'agency_max_val.ec_code',
            'uploads.reporting_period_id': 'agency_max_val.reporting_period_id',
        })
        .join('reporting_periods', { 'reporting_periods.id': 'uploads.reporting_period_id' })
        .where({ 'uploads.tenant_id': tenantId, 'uploads.invalidated_at': null })
        .orderBy([
            { column: 'reporting_periods.end_date', order: 'asc' },
            { column: 'uploads.created_at', order: 'asc' },
        ]);

    logger.fields.sheet.totalUploads = uploads.length;
    logger.info('retrieved uploads for periods in report');

    // Track counts of all & EC-type (which will be filtered and used to populate rows) records
    let allrecordsCounter = 0;
    let ecRecordsCounter = 0;

    // Across all records in all fetched uploads in the reporting period,
    // retain only the rows derived from the latest record pertaining to each unique project.
    const rowsByProject = new Map();

    // This loop must be executed synchronously for two reasons:
    //  1. Order of fetched `uploads` is important for finding the "latest" record.
    //  2. We want to avoid loading and parsing more than one upload file at a time.
    for (const upload of uploads) {
        const uploadLogger = logger.child(
            { upload: { id: upload.id, reportingPeriod: { id: upload.reporting_period_id } } },
        );
        uploadLogger.info('updating rows from records in upload');

        // eslint-disable-next-line no-await-in-loop
        let records = await recordsForUpload(upload);
        allrecordsCounter += records.length;
        uploadLogger.fields.upload.totalRecords = { all: records.length };
        uploadLogger.debug('loaded all records in upload');

        records = records.filter((rec) => Object.values(EC_SHEET_TYPES).includes(rec.type));
        ecRecordsCounter += records.length;
        uploadLogger.fields.upload.totalRecords.ecRecords = records.length;
        uploadLogger.debug('filtered to usable EC records in upload');

        records.forEach((rec) => {
            // Sometimes project IDs are represented as a numeric value;
            // always treat as string to avoid errant "duplicate" map keys
            const projectId = rec.content.Project_Identification_Number__c.toString();
            const projectLogger = uploadLogger.child({ project: { id: projectId } });
            projectLogger.debug(rowsByProject.has(projectId)
                ? 'replacing existing row for project with data from newer record'
                : 'creating row for project');
            rowsByProject.set(projectId, {
                'Project ID': rec.content.Project_Identification_Number__c,
                Upload: getUploadLink(domain, rec.upload.id, rec.upload.filename),
                'Last Reported': rec.upload.reporting_period_name,
                'Adopted Budget': rec.content.Adopted_Budget__c,
                'Total Cumulative Obligations': rec.content.Total_Obligations__c,
                'Total Cumulative Expenditures': rec.content.Total_Expenditures__c,
                'Current Period Obligations': rec.content.Current_Period_Obligations__c,
                'Current Period Expenditures': rec.content.Current_Period_Expenditures__c,
                'Completion Status': rec.content.Completion_Status__c,
            });
        });
        uploadLogger.debug({ currentRowCount: rowsByProject.size }, 'updated rows from records in upload');
    }

    logger.fields.sheet.rowCount = rowsByProject.size;
    logger.fields.sheet.totalRecords = { all: allrecordsCounter, ecRecords: ecRecordsCounter };
    logger.info('finished building rows for spreadsheet');
    return Array.from(rowsByProject.values());
}

function getRecordsByProject(records) {
    // the expenditures50k tab does not have a project id, but we can pull that
    // information using the awards50k tab and make a mapping from subaward -> project.
    // the expenditures50k has subawards, so that then gets used to map to project.
    // missing info is indicated with a MISSING PROJECT
    const subawardProjectMap = records.filter((x) => x.type === 'awards50k').reduce((map, value) => {
        if (!(value.upload.filename in map)) {
            map[value.upload.filename] = {};
        }
        map[value.upload.filename][value.content.Award_No__c] = value.content.Project_Identification_Number__c;
        return map;
    }, {});
    return records.reduce((groupByProject, item) => {
        let project = item.content.Project_Identification_Number__c;
        if (item.type === 'expenditures50k' && project == null) {
            const subawardMap = subawardProjectMap[item.upload.filename];
            if (subawardMap != null) {
                project = subawardMap[item.content.Sub_Award_Lookup__c];
            }
        }
        project = project ?? 'MISSING PROJECT';
        const group = (groupByProject[project] || []);
        group.push(item);
        groupByProject[project] = group;
        return groupByProject;
    }, {});
}

async function createReportsGroupedByProject(periodId, tenantId, dateFormat = REPORTING_DATE_FORMAT, logger = log) {
    logger.info('building rows for spreadsheet');
    const records = await recordsForProject(periodId, tenantId);
    logger.fields.sheet.totalRecords = records.length;
    logger.info('retrieved records for projects');
    const recordsByProject = getRecordsByProject(records);
    logger.fields.sheet.totalProjects = Object.keys(recordsByProject).length;
    logger.info('grouped records by project');

    const allReportingPeriods = await getAllReportingPeriods(undefined, tenantId);
    logger.fields.sheet.totalReportingPeriods = allReportingPeriods.length;
    logger.info('retrieved all reporting periods for tenant');

    // index project end dates by project ID
    const endDatesByReportingPeriodId = Object.fromEntries(allReportingPeriods.map((reportingPeriod) => [
        reportingPeriod.id, moment(reportingPeriod.end_date, 'yyyy-MM-DD').format(dateFormat),
    ]));

    // create a row for each project, populated from the records related to that project
    const rows = Object.entries(recordsByProject).map(([projectId, projectRecords]) => {
        const projectLogger = logger.child({
            project: { id: projectId, totalRecords: projectRecords.length },
        });

        projectLogger.debug('populating row from records in project');

        // set values for columns that are common across all records of projectId
        const row = {
            'Project ID': projectId,
            'Project Description': projectRecords[0].content.Project_Description__c,
            'Project Expenditure Category Group': ec(projectRecords[0].type),
            'Project Expenditure Category': projectRecords[0].subcategory,
            'Capital Expenditure Amount': 0,
        };

        // get all reporting periods related to the project
        const projectReportingPeriodIds = new Set(
            projectRecords.map((r) => r.upload.reporting_period_id),
        );
        projectLogger.fields.project.totalReportingPeriods = projectReportingPeriodIds.length;
        projectLogger.debug('determined unique reporting periods for the current project');

        // for each reporting period related to the project, add 4 new columns to the row where:
        //   - the name (row key) of each column is prefixed by the reporting period's end date
        //   - the initial value for each column in this row is zero
        projectReportingPeriodIds.forEach((id) => {
            const endDate = endDatesByReportingPeriodId[id];
            row[`${endDate} Total Aggregate Expenditures`] = 0;
            row[`${endDate} Total Expenditures for Awards Greater or Equal to $50k`] = 0;
            row[`${endDate} Total Aggregate Obligations`] = 0;
            row[`${endDate} Total Obligations for Awards Greater or Equal to $50k`] = 0;
            row[`${endDate} Total Obligations for Aggregate Awards < $50k`] = 0;
            row[`${endDate} Total Expenditures for Aggregate Awards < $50k`] = 0;
        });

        // Sum the total value of each initialized column from the corresponding subtotal
        // provided by each project record
        projectRecords.forEach((record) => {
            const endDate = endDatesByReportingPeriodId[record.upload.reporting_period_id];
            row[`${endDate} Total Aggregate Expenditures`] += (record.content.Total_Expenditures__c || 0);
            row[`${endDate} Total Aggregate Obligations`] += (record.content.Total_Obligations__c || 0);
            row[`${endDate} Total Obligations for Awards Greater or Equal to $50k`] += (record.content.Award_Amount__c || 0);
            row[`${endDate} Total Expenditures for Awards Greater or Equal to $50k`] += (record.content.Expenditure_Amount__c || 0);
            row[`${endDate} Total Obligations for Aggregate Awards < $50k`] += (record.content.Quarterly_Obligation_Amt_Aggregates__c || 0);
            row[`${endDate} Total Expenditures for Aggregate Awards < $50k`] += (record.content.Quarterly_Expenditure_Amt_Aggregates__c || 0);
            row['Capital Expenditure Amount'] += (record.content.Total_Cost_Capital_Expenditure__c || 0);
        });

        projectLogger.fields.project.totalColumns = Object.keys(row).length;
        projectLogger.info('finished populating row');
        return row;
    });

    logger.fields.sheet.rowCount = rows.length;
    logger.info('finished building rows for spreadsheet');
    return rows;
}

async function createKpiDataGroupedByProject(periodId, tenantId, logger = log) {
    logger.info('building rows for spreadsheet');
    const records = await recordsForProject(periodId, tenantId);
    logger.fields.sheet.totalRecords = records.length;
    logger.info('retrieved records for project');
    const recordsByProject = getRecordsByProject(records);
    logger.fields.sheet.totalProjects = Object.keys(recordsByProject).length;
    logger.info('grouped records by project');

    const rows = Object.entries(recordsByProject).map(([projectId, projectRecords]) => {
        const projectLogger = logger.child({
            project: { id: projectId, totalRecords: projectRecords.length },
        });
        projectLogger.debug('populating row from records in project');
        const row = {
            'Project ID': projectId,
            'Number of Subawards': 0,
            'Number of Expenditures': 0,
            'Evidence Based Total Spend': 0,
        };

        projectRecords.forEach((r) => {
            if (r.type === 'awards50k') {
                row['Number of Subawards'] += 1;
            }
            if ((r.content.Current_Period_Expenditures__c || 0) > 0) {
                row['Number of Expenditures'] += 1;
            }
            row['Evidence Based Total Spend'] += (r.content.Spending_Allocated_Toward_Evidence_Based_Interventions || 0);
        });

        projectLogger.info('finished populating row');
        return row;
    });

    logger.fields.sheet.rowCount = rows.length;
    logger.info('finished building rows for spreadsheet');
    return rows;
}

/*
 * Function to format the headers for the project summaries.
 * The headers are split into the date and non-date headers.
 * The non-date headers come first with an ordering, then the date headers.
 */
function createHeadersProjectSummariesV2(projectSummaryGroupedByProject) {
    const keys = Array.from(new Set(projectSummaryGroupedByProject.map(Object.keys).flat()));
    // split up by date and not date
    const withDate = keys.filter((x) => REPORTING_DATE_REGEX.exec(x));
    const withoutDate = keys.filter((x) => REPORTING_DATE_REGEX.exec(x) == null);

    const dateOrder = withDate.reduce((x, y) => {
        const key = y.replace(REPORTING_DATE_REGEX, '');
        const value = y.match(REPORTING_DATE_REGEX)[1];
        if (value == null) {
            log.warn({ reportingDateRegex: REPORTING_DATE_REGEX }, 'could not find reporting date in header');
            return x;
        }

        if (!(key in x)) {
            x[key] = [];
        }
        x[key].push(moment(value, REPORTING_DATE_FORMAT));
        return x;
    }, {});

    const expectedOrderWithoutDate = [
        'Project ID',
        'Project Description',
        'Project Expenditure Category Group',
        'Project Expenditure Category',
        'Capital Expenditure Amount',
    ];

    const expectedOrderWithDate = [
        'Total Aggregate Obligations',
        'Total Aggregate Expenditures',
        'Total Obligations for Awards Greater or Equal to $50k',
        'Total Expenditures for Awards Greater or Equal to $50k',
        'Total Obligations for Aggregate Awards < $50k',
        'Total Expenditures for Aggregate Awards < $50k',
    ];

    // first add the properly ordered non-date headers,
    // then add the headers sorted by the header group then the date
    const headers = [
        ...withoutDate.sort((p1, p2) => expectedOrderWithoutDate.indexOf(p1) - expectedOrderWithoutDate.indexOf(p2)),
        ...Object.entries(dateOrder)
            .sort((p1, p2) => expectedOrderWithDate.indexOf(p1[0]) - expectedOrderWithDate.indexOf(p2[0]))
            .map((x) => x[1]
                .sort((d1, d2) => d1.valueOf() - d2.valueOf())
                .map((date) => `${date.format(REPORTING_DATE_FORMAT)} ${x[0]}`)).flat(),
    ];

    return headers;
}

async function generate(requestHost, tenantId) {
    const domain = ARPA_REPORTER_BASE_URL ?? requestHost;
    return tracer.trace('generate()', async () => {
        const periodId = await getCurrentReportingPeriodID(undefined, tenantId);
        const logger = processStatsLogger(log, {
            workbook: { period: { id: periodId }, tenant: { id: tenantId } },
        });
        logger.info('determined current reporting period ID for workbook');

        // generate sheets data
        const obligations = await tracer.trace('createObligationSheet',
            async () => createObligationSheet(
                periodId,
                domain,
                tenantId,
                logger.child({ sheet: { name: 'Obligations & Expenditures' } }),
            ));
        const projectSummaries = await tracer.trace('createProjectSummaries',
            async () => createProjectSummaries(
                periodId,
                domain,
                tenantId,
                logger.child({ sheet: { name: 'Project Summaries' } }),
            ));
        const projectSummaryGroupedByProject = await tracer.trace('createReportsGroupedByProject',
            async () => createReportsGroupedByProject(
                periodId,
                tenantId,
                REPORTING_DATE_FORMAT,
                logger.child({ sheet: { name: 'Project Summaries V2' } }),
            ));
        const KPIDataGroupedByProject = await tracer.trace('createKpiDataGroupedByProject',
            async () => createKpiDataGroupedByProject(
                periodId,
                tenantId,
                logger.child({ sheet: { name: 'KPI' } }),
            ));

        // compose workbook
        const workbook = tracer.trace('compose-workbook', () => {
            logger.info('composing workbook');

            // build the individual xlsx worksheets from aggregated data
            log.info('building sheets from aggregated data');
            const jsonToSheet = (data, name, options = {}) => {
                const sheet = XLSX.utils.json_to_sheet(data, { dateNF: 'MM/DD/YYYY', ...options });
                log.info({ sheet: { name } }, 'created sheet from JSON');
                return sheet;
            };
            const sheet1 = jsonToSheet(obligations, 'Obligations & Expenditures');
            const sheet2 = jsonToSheet(projectSummaries, 'Project Summaries');
            const sheet3 = jsonToSheet(projectSummaryGroupedByProject, 'Project Summaries V2', {
                header: createHeadersProjectSummariesV2(projectSummaryGroupedByProject),
            });
            const sheet4 = jsonToSheet(KPIDataGroupedByProject, 'KPI');
            log.info('finished building sheets from aggregated data');

            // create the workbook and add sheet data
            logger.info('making new workbook');
            const newWorkbook = XLSX.utils.book_new();
            const addSheetToWorkbook = (sheet, name) => {
                XLSX.utils.book_append_sheet(newWorkbook, sheet, name);
                logger.info({ sheet: { name } }, 'added sheet to workbook');
            };
            addSheetToWorkbook(sheet1, 'Obligations & Expenditures');
            addSheetToWorkbook(sheet2, 'Project Summaries');
            addSheetToWorkbook(sheet3, 'Project Summaries V2');
            addSheetToWorkbook(sheet4, 'KPI');
            logger.info('finished making new workbook');

            logger.info('finished composing workbook');
            return newWorkbook;
        });

        const outputWorkBook = tracer.trace('XLSX.write', () => {
            logger.info('writing workbook to buffer');
            const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
            logger.info({ bufferSizeInBytes: buffer.length }, 'finished writing workbook to buffer');
            return buffer;
        });

        const filename = `audit-report-${moment().format('yy-MM-DD')}-${v4()}.xlsx`;
        log.info({ generatedFilename: filename }, 'generated filename for workbook');

        return {
            periodId,
            filename,
            outputWorkBook,
        };
    });
}

async function sendEmailWithLink(fileKey, recipientEmail, logger = log) {
    const url = `${process.env.API_DOMAIN}/api/audit_report/${fileKey}`;
    await email.sendAsyncReportEmail(recipientEmail, url, email.ASYNC_REPORT_TYPES.audit);
    logger.info({ downloadUrl: url }, 'emailed workbook download link to requesting user');
}

async function generateAndSendEmail(requestHost, recipientEmail, tenantId = useTenantId(), logger = log) {
    logger = logger.child({ tenant: { id: tenantId } });
    // Generate the report
    logger.info('generating ARPA audit report');
    const report = await module.exports.generate(requestHost, tenantId);
    logger.info('finished generating ARPA audit report');
    // Upload to S3 and send email link
    const reportKey = `${tenantId}/${report.periodId}/${report.filename}`;
    log.info({ reportKey }, 'created report key');

    const s3 = aws.getS3Client();
    const uploadParams = {
        Bucket: process.env.AUDIT_REPORT_BUCKET,
        Key: reportKey,
        Body: report.outputWorkBook,
        ServerSideEncryption: 'AES256',
    };

    try {
        logger.info({ uploadParams: { Bucket: uploadParams.Bucket, Key: uploadParams.Key } },
            'uploading ARPA audit report to S3');
        await s3.send(new PutObjectCommand(uploadParams));
        await module.exports.sendEmailWithLink(reportKey, recipientEmail, logger);
    } catch (err) {
        logger.error({ err }, 'failed to upload/email audit report');
        throw err;
    }
    logger.info('finished generating and sending ARPA audit report');
}

async function processSQSMessageRequest(message) {
    let requestData;
    try {
        requestData = JSON.parse(message.Body);
    } catch (err) {
        log.error({ err }, 'error parsing request data from SQS message');
        return false;
    }

    try {
        const user = await getUser(requestData.userId);
        if (!user) {
            throw new Error(`user not found: ${requestData.userId}`);
        }
        await generateAndSendEmail(ARPA_REPORTER_BASE_URL, user.email, user.tenant_id);
    } catch (err) {
        log.error({ err }, 'failed to generate and send audit report');
        return false;
    }

    log.info('successfully completed SQS message request');
    return true;
}

module.exports = {
    generate,
    generateAndSendEmail,
    processSQSMessageRequest,
    sendEmailWithLink,
    createHeadersProjectSummariesV2,

    // export for testing
    getRecordsByProject,
};

// NOTE: This file was copied from src/server/lib/audit-report.js (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z
