const moment = require('moment');
const AdmZip = require('adm-zip');
const XLSX = require('xlsx');
const asyncBatch = require('async-batch').default;

const { applicationSettings } = require('../db/settings');
const { listRecipientsForReportingPeriod } = require('../db/arpa-subrecipients');
const { getTemplate } = require('./get-template');
const { recordsForReportingPeriod } = require('./records');
const {
    capitalizeFirstLetter,
    currency,
    ec,
    multiselect,
    subcategory,
    tin,
    zip,
    zip4,
} = require('../lib/format');
const { requiredArgument } = require('../lib/preconditions');

const BOM = '\ufeff'; // UTF-8 byte order mark
const EC_CODE_REGEX = /^(\d.\d\d?)/;

// dropdown value used to differentiate payments under 50k
const PAYMENTS_TO_INDIVIDUALS = 'Payments to Individuals';

/**
 * Extract the Detailed Expenditure Category code from a record.
 *
 * @returns {string} The detailed EC code in format "#.##".
 */
function getDetailedEcCode(record) {
    const match = EC_CODE_REGEX.exec(record.subcategory);
    return match?.[1];
}

function isNotNull(value) {
    // `== null` matches null AND undefined
    return value != null;
}

function isProjectRecord(record) {
    return [
        'ec1', 'ec2', 'ec3', 'ec4', 'ec5', 'ec7',
    ].includes(record.type);
}

async function generateReportName(periodId, tenantId) {
    const now = moment().utc();
    const { title: state } = await applicationSettings(tenantId);

    const filename = [
        state.replace(/ /g, '-'),
        'Period',
        // TODO: in multitenant world, should this use a filename-safe version of period.name instead of
        // periodId?
        periodId,
        'ARPA-Treasury-Report-generated',
        now.format('YYYY-MM-DDTHH:mm:ss'),
    ].join('-');

    return filename;
}

async function generateProject111210(records) {
    return records
        .filter(isProjectRecord)
        .map((record) => {
            const detailedEcCode = getDetailedEcCode(record);
            switch (detailedEcCode) {
                case '1.11':
                case '2.10': {
                    return [
                        null, // first col is blank
                        ec(record.type),
                        subcategory(detailedEcCode),
                        record.content.Name,
                        record.content.Project_Identification_Number__c,
                        record.content.Completion_Status__c,
                        record.content.Cancellation_Reason__c,
                        currency(record.content.Adopted_Budget__c),
                        currency(record.content.Total_Obligations__c),
                        currency(record.content.Total_Expenditures__c),
                        currency(record.content.Q3_2022_Obligations__c ?? record.content.Current_Period_Obligations__c),
                        currency(record.content.Q3_2022_Expenditures__c ?? record.content.Current_Period_Expenditures__c),
                        capitalizeFirstLetter(record.content.Does_Project_Include_Capital_Expenditure__c),
                        currency(record.content.Total_Cost_Capital_Expenditure__c),
                        record.content.Type_of_Capital_Expenditure__c,
                        record.content.Type_of_Capital_Expenditure_Other__c,
                        record.content.Capital_Expenditure_Justification__c,
                        record.content.Project_Description__c,
                        currency(record.content.Program_Income_Earned__c),
                        currency(record.content.Program_Income_Expended__c),
                        record.content.Primary_Project_Demographics__c,
                        record.content.Primary_Project_Demographics_Explanation__c,
                        record.content.Secondary_Project_Demographics__c,
                        record.content.Secondary_Proj_Demographics_Explanation__c,
                        record.content.Tertiary_Project_Demographics__c,
                        record.content.Tertiary_Proj_Demographics_Explanation__c,
                        record.content.Structure_Objectives_of_Asst_Programs__c,
                        record.content.Recipient_Approach_Description__c,
                        record.content.Number_Workers_Enrolled_Sectoral__c,
                        record.content.Number_Workers_Competing_Sectoral__c,
                        record.content.Number_People_Summer_Youth__c,
                    ];
                }
                default:
                    return null;
            }
        })
        .filter(isNotNull);
}

async function generateProject18(records) {
    return records
        .filter(isProjectRecord)
        .map((record) => {
            const detailedEcCode = getDetailedEcCode(record);
            switch (detailedEcCode) {
                case '1.8':
                case '2.29':
                case '2.30':
                case '2.31':
                case '2.32':
                case '2.33': {
                    return [
                        null, // first col is blank
                        ec(record.type),
                        subcategory(detailedEcCode),
                        record.content.Name,
                        record.content.Project_Identification_Number__c,
                        record.content.Completion_Status__c,
                        record.content.Cancellation_Reason__c,
                        currency(record.content.Adopted_Budget__c),
                        currency(record.content.Total_Obligations__c),
                        currency(record.content.Total_Expenditures__c),
                        currency(record.content.Q3_2022_Obligations__c ?? record.content.Current_Period_Obligations__c),
                        currency(record.content.Q3_2022_Expenditures__c ?? record.content.Current_Period_Expenditures__c),
                        capitalizeFirstLetter(record.content.Does_Project_Include_Capital_Expenditure__c),
                        currency(record.content.Total_Cost_Capital_Expenditure__c),
                        record.content.Type_of_Capital_Expenditure__c,
                        record.content.Type_of_Capital_Expenditure_Other__c,
                        record.content.Capital_Expenditure_Justification__c,
                        record.content.Project_Description__c,
                        currency(record.content.Program_Income_Earned__c),
                        currency(record.content.Program_Income_Expended__c),
                        record.content.Primary_Project_Demographics__c,
                        record.content.Primary_Project_Demographics_Explanation__c,
                        record.content.Secondary_Project_Demographics__c,
                        record.content.Secondary_Proj_Demographics_Explanation__c,
                        record.content.Tertiary_Project_Demographics__c,
                        record.content.Tertiary_Proj_Demographics_Explanation__c,
                        record.content.Structure_Objectives_of_Asst_Programs__c,
                        record.content.Recipient_Approach_Description__c,
                        record.content.Small_Businesses_Served__c,
                    ];
                }
                default:
                    return null;
            }
        })
        .filter(isNotNull);
}

async function generateProject19(records) {
    return records
        .filter(isProjectRecord)
        .map((record) => {
            const detailedEcCode = getDetailedEcCode(record);
            switch (detailedEcCode) {
                case '1.9':
                case '2.34': {
                    return [
                        null, // first col is blank
                        ec(record.type),
                        subcategory(detailedEcCode),
                        record.content.Name,
                        record.content.Project_Identification_Number__c,
                        record.content.Completion_Status__c,
                        record.content.Cancellation_Reason__c,
                        currency(record.content.Adopted_Budget__c),
                        currency(record.content.Total_Obligations__c),
                        currency(record.content.Total_Expenditures__c),
                        currency(record.content.Q3_2022_Obligations__c ?? record.content.Current_Period_Obligations__c),
                        currency(record.content.Q3_2022_Expenditures__c ?? record.content.Current_Period_Expenditures__c),
                        capitalizeFirstLetter(record.content.Does_Project_Include_Capital_Expenditure__c),
                        currency(record.content.Total_Cost_Capital_Expenditure__c),
                        record.content.Type_of_Capital_Expenditure__c,
                        record.content.Type_of_Capital_Expenditure_Other__c,
                        record.content.Capital_Expenditure_Justification__c,
                        record.content.Project_Description__c,
                        currency(record.content.Program_Income_Earned__c),
                        currency(record.content.Program_Income_Expended__c),
                        record.content.Primary_Project_Demographics__c,
                        record.content.Primary_Project_Demographics_Explanation__c,
                        record.content.Secondary_Project_Demographics__c,
                        record.content.Secondary_Proj_Demographics_Explanation__c,
                        record.content.Tertiary_Project_Demographics__c,
                        record.content.Tertiary_Proj_Demographics_Explanation__c,
                        record.content.Structure_Objectives_of_Asst_Programs__c,
                        record.content.Recipient_Approach_Description__c,
                        record.content.Number_Non_Profits_Served__c,
                    ];
                }
                default:
                    return null;
            }
        })
        .filter(isNotNull);
}

async function generateProject211214(records) {
    return records
        .filter(isProjectRecord)
        .map((record) => {
            const detailedEcCode = getDetailedEcCode(record);
            switch (detailedEcCode) {
                case '2.11':
                case '2.12':
                case '2.13':
                case '2.14': {
                    return [
                        null, // first col is blank
                        ec(record.type),
                        subcategory(detailedEcCode),
                        record.content.Name,
                        record.content.Project_Identification_Number__c,
                        record.content.Completion_Status__c,
                        record.content.Cancellation_Reason__c,
                        currency(record.content.Adopted_Budget__c),
                        currency(record.content.Total_Obligations__c),
                        currency(record.content.Total_Expenditures__c),
                        currency(record.content.Q3_2022_Obligations__c ?? record.content.Current_Period_Obligations__c),
                        currency(record.content.Q3_2022_Expenditures__c ?? record.content.Current_Period_Expenditures__c),
                        capitalizeFirstLetter(record.content.Does_Project_Include_Capital_Expenditure__c),
                        currency(record.content.Total_Cost_Capital_Expenditure__c),
                        record.content.Type_of_Capital_Expenditure__c,
                        record.content.Type_of_Capital_Expenditure_Other__c,
                        record.content.Capital_Expenditure_Justification__c,
                        record.content.Project_Description__c,
                        currency(record.content.Program_Income_Earned__c),
                        currency(record.content.Program_Income_Expended__c),
                        record.content.Primary_Project_Demographics__c,
                        record.content.Primary_Project_Demographics_Explanation__c,
                        record.content.Secondary_Project_Demographics__c,
                        record.content.Secondary_Proj_Demographics_Explanation__c,
                        record.content.Tertiary_Project_Demographics__c,
                        record.content.Tertiary_Proj_Demographics_Explanation__c,
                        record.content.Structure_Objectives_of_Asst_Programs__c,
                        record.content.Recipient_Approach_Description__c,
                        record.content.School_ID_or_District_ID__c,
                        record.content.Number_Children_Served_Childcare__c,
                        record.content.Number_Families_Served_Home_Visiting__c,
                    ];
                }
                default:
                    return null;
            }
        })
        .filter(isNotNull);
}

async function generateProject2128(records) {
    return records
        .filter(isProjectRecord)
        .map((record) => {
            const detailedEcCode = getDetailedEcCode(record);
            switch (detailedEcCode) {
                case '2.1':
                case '2.2':
                case '2.3':
                case '2.4':
                case '2.5':
                case '2.6':
                case '2.7':
                case '2.8': {
                    return [
                        null, // first col is blank
                        ec(record.type),
                        subcategory(detailedEcCode),
                        record.content.Name,
                        record.content.Project_Identification_Number__c,
                        record.content.Completion_Status__c,
                        record.content.Cancellation_Reason__c,
                        currency(record.content.Adopted_Budget__c),
                        currency(record.content.Total_Obligations__c),
                        currency(record.content.Total_Expenditures__c),
                        currency(record.content.Q3_2022_Obligations__c ?? record.content.Current_Period_Obligations__c),
                        currency(record.content.Q3_2022_Expenditures__c ?? record.content.Current_Period_Expenditures__c),
                        capitalizeFirstLetter(record.content.Does_Project_Include_Capital_Expenditure__c),
                        currency(record.content.Total_Cost_Capital_Expenditure__c),
                        record.content.Type_of_Capital_Expenditure__c,
                        record.content.Type_of_Capital_Expenditure_Other__c,
                        record.content.Capital_Expenditure_Justification__c,
                        record.content.Project_Description__c,
                        currency(record.content.Program_Income_Earned__c),
                        currency(record.content.Program_Income_Expended__c),
                        record.content.Primary_Project_Demographics__c,
                        record.content.Primary_Project_Demographics_Explanation__c,
                        record.content.Secondary_Project_Demographics__c,
                        record.content.Secondary_Proj_Demographics_Explanation__c,
                        record.content.Tertiary_Project_Demographics__c,
                        record.content.Tertiary_Proj_Demographics_Explanation__c,
                        record.content.Structure_Objectives_of_Asst_Programs__c,
                        record.content.Recipient_Approach_Description__c,
                        record.content.Individuals_Served__c,
                        record.content.Number_Households_Eviction_Prevention__c,
                        record.content.Number_Affordable_Housing_Units__c,
                    ];
                }
                default:
                    return null;
            }
        })
        .filter(isNotNull);
}

async function generateProject215218(records) {
    return records
        .filter(isProjectRecord)
        .map((record) => {
            const detailedEcCode = getDetailedEcCode(record);
            switch (detailedEcCode) {
                case '2.15':
                case '2.16':
                case '2.17':
                case '2.18': {
                    return [
                        null, // first col is blank
                        ec(record.type),
                        subcategory(detailedEcCode),
                        record.content.Name,
                        record.content.Project_Identification_Number__c,
                        record.content.Completion_Status__c,
                        record.content.Cancellation_Reason__c,
                        currency(record.content.Adopted_Budget__c),
                        currency(record.content.Total_Obligations__c),
                        currency(record.content.Total_Expenditures__c),
                        currency(record.content.Q3_2022_Obligations__c ?? record.content.Current_Period_Obligations__c),
                        currency(record.content.Q3_2022_Expenditures__c ?? record.content.Current_Period_Expenditures__c),
                        capitalizeFirstLetter(record.content.Does_Project_Include_Capital_Expenditure__c),
                        currency(record.content.Total_Cost_Capital_Expenditure__c),
                        record.content.Type_of_Capital_Expenditure__c,
                        record.content.Type_of_Capital_Expenditure_Other__c,
                        record.content.Capital_Expenditure_Justification__c,
                        record.content.Project_Description__c,
                        currency(record.content.Program_Income_Earned__c),
                        currency(record.content.Program_Income_Expended__c),
                        record.content.Primary_Project_Demographics__c,
                        record.content.Primary_Project_Demographics_Explanation__c,
                        record.content.Secondary_Project_Demographics__c,
                        record.content.Secondary_Proj_Demographics_Explanation__c,
                        record.content.Tertiary_Project_Demographics__c,
                        record.content.Tertiary_Proj_Demographics_Explanation__c,
                        record.content.Structure_Objectives_of_Asst_Programs__c,
                        record.content.Recipient_Approach_Description__c,
                        record.content.Number_Households_Eviction_Prevention__c,
                        record.content.Number_Affordable_Housing_Units__c,
                    ];
                }
                default:
                    return null;
            }
        })
        .filter(isNotNull);
}

async function generateProject224227(records) {
    return records
        .filter(isProjectRecord)
        .map((record) => {
            const detailedEcCode = getDetailedEcCode(record);
            switch (detailedEcCode) {
                case '2.24':
                case '2.25':
                case '2.26':
                case '2.27': {
                    return [
                        null, // first col is blank
                        ec(record.type),
                        subcategory(detailedEcCode),
                        record.content.Name,
                        record.content.Project_Identification_Number__c,
                        record.content.Completion_Status__c,
                        record.content.Cancellation_Reason__c,
                        currency(record.content.Adopted_Budget__c),
                        currency(record.content.Total_Obligations__c),
                        currency(record.content.Total_Expenditures__c),
                        currency(record.content.Q3_2022_Obligations__c ?? record.content.Current_Period_Obligations__c),
                        currency(record.content.Q3_2022_Expenditures__c ?? record.content.Current_Period_Expenditures__c),
                        capitalizeFirstLetter(record.content.Does_Project_Include_Capital_Expenditure__c),
                        currency(record.content.Total_Cost_Capital_Expenditure__c),
                        record.content.Type_of_Capital_Expenditure__c,
                        record.content.Type_of_Capital_Expenditure_Other__c,
                        record.content.Capital_Expenditure_Justification__c,
                        record.content.Project_Description__c,
                        currency(record.content.Program_Income_Earned__c),
                        currency(record.content.Program_Income_Expended__c),
                        record.content.Primary_Project_Demographics__c,
                        record.content.Primary_Project_Demographics_Explanation__c,
                        record.content.Secondary_Project_Demographics__c,
                        record.content.Secondary_Proj_Demographics_Explanation__c,
                        record.content.Tertiary_Project_Demographics__c,
                        record.content.Tertiary_Proj_Demographics_Explanation__c,
                        record.content.Structure_Objectives_of_Asst_Programs__c,
                        record.content.Recipient_Approach_Description__c,
                        record.content.School_ID_or_District_ID__c,
                        record.content.Number_Students_Tutoring_Programs__c,
                    ];
                }
                default:
                    return null;
            }
        })
        .filter(isNotNull);
}

async function generateProject236(records) {
    return records
        .filter(isProjectRecord)
        .map((record) => {
            const detailedEcCode = getDetailedEcCode(record);
            switch (detailedEcCode) {
                case '2.36': {
                    return [
                        null, // first col is blank
                        ec(record.type),
                        subcategory(detailedEcCode),
                        record.content.Name,
                        record.content.Project_Identification_Number__c,
                        record.content.Completion_Status__c,
                        record.content.Cancellation_Reason__c,
                        currency(record.content.Adopted_Budget__c),
                        currency(record.content.Total_Obligations__c),
                        currency(record.content.Total_Expenditures__c),
                        currency(record.content.Q3_2022_Obligations__c ?? record.content.Current_Period_Obligations__c),
                        currency(record.content.Q3_2022_Expenditures__c ?? record.content.Current_Period_Expenditures__c),
                        capitalizeFirstLetter(record.content.Does_Project_Include_Capital_Expenditure__c),
                        currency(record.content.Total_Cost_Capital_Expenditure__c),
                        record.content.Type_of_Capital_Expenditure__c,
                        record.content.Type_of_Capital_Expenditure_Other__c,
                        record.content.Capital_Expenditure_Justification__c,
                        record.content.Project_Description__c,
                        currency(record.content.Program_Income_Earned__c),
                        currency(record.content.Program_Income_Expended__c),
                        record.content.Primary_Project_Demographics__c,
                        record.content.Primary_Project_Demographics_Explanation__c,
                        record.content.Secondary_Project_Demographics__c,
                        record.content.Secondary_Proj_Demographics_Explanation__c,
                        record.content.Tertiary_Project_Demographics__c,
                        record.content.Tertiary_Proj_Demographics_Explanation__c,
                        record.content.Structure_Objectives_of_Asst_Programs__c,
                        record.content.Recipient_Approach_Description__c,
                        record.content.Industry_Experienced_8_Percent_Loss__c,
                    ];
                }
                default:
                    return null;
            }
        })
        .filter(isNotNull);
}

async function generateProject31(records) {
    return records
        .filter(isProjectRecord)
        .map((record) => {
            const detailedEcCode = getDetailedEcCode(record);
            switch (detailedEcCode) {
                case '3.1': {
                    return [
                        null, // first col is blank
                        ec(record.type),
                        subcategory(detailedEcCode),
                        record.content.Name,
                        record.content.Project_Identification_Number__c,
                        record.content.Completion_Status__c,
                        record.content.Cancellation_Reason__c,
                        currency(record.content.Adopted_Budget__c),
                        currency(record.content.Total_Obligations__c),
                        currency(record.content.Total_Expenditures__c),
                        currency(record.content.Q3_2022_Obligations__c ?? record.content.Current_Period_Obligations__c),
                        currency(record.content.Q3_2022_Expenditures__c ?? record.content.Current_Period_Expenditures__c),
                        capitalizeFirstLetter(record.content.Does_Project_Include_Capital_Expenditure__c),
                        currency(record.content.Total_Cost_Capital_Expenditure__c),
                        record.content.Type_of_Capital_Expenditure__c,
                        record.content.Type_of_Capital_Expenditure_Other__c,
                        record.content.Capital_Expenditure_Justification__c,
                        record.content.Project_Description__c,
                        currency(record.content.Program_Income_Earned__c),
                        currency(record.content.Program_Income_Expended__c),
                        record.content.Structure_Objectives_of_Asst_Programs__c,
                        record.content.Recipient_Approach_Description__c,
                        record.content.Payroll_Public_Health_Safety__c,
                    ];
                }
                default:
                    return null;
            }
        })
        .filter(isNotNull);
}

async function generateProject32(records) {
    return records
        .filter(isProjectRecord)
        .map((record) => {
            const detailedEcCode = getDetailedEcCode(record);
            switch (detailedEcCode) {
                case '3.2': {
                    return [
                        null, // first col is blank
                        ec(record.type),
                        subcategory(detailedEcCode),
                        record.content.Name,
                        record.content.Project_Identification_Number__c,
                        record.content.Completion_Status__c,
                        record.content.Cancellation_Reason__c,
                        currency(record.content.Adopted_Budget__c),
                        currency(record.content.Total_Obligations__c),
                        currency(record.content.Total_Expenditures__c),
                        currency(record.content.Q3_2022_Obligations__c ?? record.content.Current_Period_Obligations__c),
                        currency(record.content.Q3_2022_Expenditures__c ?? record.content.Current_Period_Expenditures__c),
                        capitalizeFirstLetter(record.content.Does_Project_Include_Capital_Expenditure__c),
                        currency(record.content.Total_Cost_Capital_Expenditure__c),
                        record.content.Type_of_Capital_Expenditure__c,
                        record.content.Type_of_Capital_Expenditure_Other__c,
                        record.content.Capital_Expenditure_Justification__c,
                        record.content.Project_Description__c,
                        currency(record.content.Program_Income_Earned__c),
                        currency(record.content.Program_Income_Expended__c),
                        record.content.Structure_Objectives_of_Asst_Programs__c,
                        record.content.Recipient_Approach_Description__c,
                        record.content.Number_of_FTEs_Rehired__c,
                    ];
                }
                default:
                    return null;
            }
        })
        .filter(isNotNull);
}

async function generateProject4142(records) {
    return records
        .filter(isProjectRecord)
        .map((record) => {
            const detailedEcCode = getDetailedEcCode(record);
            switch (detailedEcCode) {
                case '4.1':
                case '4.2': {
                    return [
                        null, // first col is blank
                        ec(record.type),
                        subcategory(detailedEcCode),
                        record.content.Name,
                        record.content.Project_Identification_Number__c,
                        record.content.Completion_Status__c,
                        record.content.Cancellation_Reason__c,
                        currency(record.content.Adopted_Budget__c),
                        currency(record.content.Total_Obligations__c),
                        currency(record.content.Total_Expenditures__c),
                        currency(record.content.Q3_2022_Obligations__c ?? record.content.Current_Period_Obligations__c),
                        currency(record.content.Q3_2022_Expenditures__c ?? record.content.Current_Period_Expenditures__c),
                        record.content.Project_Description__c,
                        currency(record.content.Program_Income_Earned__c),
                        currency(record.content.Program_Income_Expended__c),
                        multiselect(record.content.Sectors_Critical_to_Health_Well_Being__c),
                        record.content.Workers_Served__c,
                        record.content.Premium_Pay_Narrative__c,
                        record.content.Number_of_Workers_K_12__c,
                    ];
                }
                default:
                    return null;
            }
        })
        .filter(isNotNull);
}

async function generateProject51518(records) {
    return records
        .filter(isProjectRecord)
        .map((record) => {
            const detailedEcCode = getDetailedEcCode(record);
            switch (detailedEcCode) {
                case '5.1':
                case '5.2':
                case '5.3':
                case '5.4':
                case '5.5':
                case '5.6':
                case '5.7':
                case '5.8':
                case '5.9':
                case '5.10':
                case '5.11':
                case '5.12':
                case '5.13':
                case '5.14':
                case '5.15':
                case '5.16':
                case '5.17':
                case '5.18': {
                    return [
                        null, // first col is blank
                        ec(record.type),
                        subcategory(detailedEcCode),
                        record.content.Name,
                        record.content.Project_Identification_Number__c,
                        record.content.Completion_Status__c,
                        record.content.Cancellation_Reason__c,
                        currency(record.content.Adopted_Budget__c),
                        currency(record.content.Total_Obligations__c),
                        currency(record.content.Total_Expenditures__c),
                        currency(record.content.Q3_2022_Obligations__c ?? record.content.Current_Period_Obligations__c),
                        currency(record.content.Q3_2022_Expenditures__c ?? record.content.Current_Period_Expenditures__c),
                        record.content.Project_Description__c,
                        currency(record.content.Program_Income_Earned__c),
                        currency(record.content.Program_Income_Expended__c),
                        record.content.Proj_Actual_Construction_Start_Date__c,
                        record.content.Initiation_of_Operations_Date__c,
                        record.content.Location__c,
                        record.content.Location_Detail__c,
                        record.content.National_Pollutant_Discharge_Number__c,
                        record.content.Public_Water_System_PWS_ID_number__c,
                        record.content.Median_Household_Income_Service_Area__c,
                        currency(record.content.Lowest_Quintile_Income__c),
                    ];
                }
                default:
                    return null;
            }
        })
        .filter(isNotNull);
}

async function generateProject519521(records) {
    return records
        .filter(isProjectRecord)
        .map((record) => {
            const detailedEcCode = getDetailedEcCode(record);
            switch (detailedEcCode) {
                case '5.19':
                case '5.20':
                case '5.21': {
                    return [
                        null, // first col is blank
                        ec(record.type),
                        subcategory(detailedEcCode),
                        record.content.Name,
                        record.content.Project_Identification_Number__c,
                        record.content.Completion_Status__c,
                        record.content.Cancellation_Reason__c,
                        currency(record.content.Adopted_Budget__c),
                        currency(record.content.Total_Obligations__c),
                        currency(record.content.Total_Expenditures__c),
                        currency(record.content.Q3_2022_Obligations__c ?? record.content.Current_Period_Obligations__c),
                        currency(record.content.Q3_2022_Expenditures__c ?? record.content.Current_Period_Expenditures__c),
                        record.content.Project_Description__c,
                        currency(record.content.Program_Income_Earned__c),
                        currency(record.content.Program_Income_Expended__c),
                        record.content.Proj_Actual_Construction_Start_Date__c,
                        record.content.Initiation_of_Operations_Date__c,
                        capitalizeFirstLetter(record.content.Is_project_designed_to_meet_100_mbps__c),
                        record.content.Project_not_met_100_mbps_explanation__c,
                        capitalizeFirstLetter(record.content.Is_project_designed_to_exceed_100_mbps__c),
                        capitalizeFirstLetter(record.content.Is_project_designed_provide_hh_service__c),
                        record.content.Confirm_Service_Provider__c,
                        record.content.Technology_Type_Planned__c,
                        record.content.Technology_Type_Planned_Other__c,
                        record.content.Technology_Type_Actual__c,
                        record.content.Technology_Type_Actual_Other__c,
                        record.content.Total_Miles_of_Fiber_Deployed__c,
                        record.content.Total_Miles_of_Fiber_Deployed_Actual__c,
                        record.content.Planned_Funded_Locations_Served__c,
                        record.content.Actual_Funded_Locations_Served__c,
                        record.content.Planned_Funded_Locations_25_3_Below__c,
                        record.content.Planned_Funded_Locations_Between_25_100__c,
                        record.content.Planned_Funded_Locations_Minimum_100_100__c,
                        record.content.Actual_Funded_Locations_Minimum_100_100__c,
                        record.content.Planned_Funded_Locations_Minimum_100_20__c,
                        record.content.Actual_Funded_Locations_Minimum_100_20__c,
                        record.content.Planned_Sum_Speed_Types_Explanation__c,
                        record.content.Actual_Sum_Speed_Types_Explanation__c,
                        record.content.Planned_Funded_Locations_Residential__c,
                        record.content.Actual_Funded_Locations_Residential__c,
                        record.content.Planned_Funded_Locations_Total_Housing__c,
                        record.content.Actual_Funded_Locations_Total_Housing__c,
                        record.content.Planned_Funded_Locations_Business__c,
                        record.content.Actual_Funded_Locations_Business__c,
                        record.content.Planned_Funded_Locations_Community__c,
                        record.content.Actual_Funded_Locations_Community__c,
                        record.content.Planned_Funded_Locations_Explanation__c,
                        record.content.Actual_Funded_Locations_Explanation__c,
                    ];
                }
                default:
                    return null;
            }
        })
        .filter(isNotNull);
}

async function generateProjectBaseline(records) {
    return records
        .filter(isProjectRecord)
        .map((record) => {
            const detailedEcCode = getDetailedEcCode(record);
            switch (detailedEcCode) {
                case '1.1':
                case '1.2':
                case '1.3':
                case '1.4':
                case '1.5':
                case '1.6':
                case '1.7':
                case '1.10':
                case '1.12':
                case '1.13':
                case '1.14':
                case '2.9':
                case '2.19':
                case '2.20':
                case '2.21':
                case '2.22':
                case '2.23':
                case '2.28':
                case '2.35':
                case '2.37':
                case '3.3':
                case '3.4':
                case '3.5':
                case '7.1':
                case '7.2': {
                    return [
                        null, // first col is blank
                        ec(record.type),
                        subcategory(detailedEcCode),
                        record.content.Name,
                        record.content.Project_Identification_Number__c,
                        record.content.Completion_Status__c,
                        record.content.Cancellation_Reason__c,
                        currency(record.content.Adopted_Budget__c),
                        currency(record.content.Total_Obligations__c),
                        currency(record.content.Total_Expenditures__c),
                        currency(record.content.Q3_2022_Obligations__c ?? record.content.Current_Period_Obligations__c),
                        currency(record.content.Q3_2022_Expenditures__c ?? record.content.Current_Period_Expenditures__c),
                        capitalizeFirstLetter(record.content.Does_Project_Include_Capital_Expenditure__c),
                        currency(record.content.Total_Cost_Capital_Expenditure__c),
                        record.content.Type_of_Capital_Expenditure__c,
                        record.content.Type_of_Capital_Expenditure_Other__c,
                        record.content.Capital_Expenditure_Justification__c,
                        record.content.Project_Description__c,
                        currency(record.content.Program_Income_Earned__c),
                        currency(record.content.Program_Income_Expended__c),
                        record.content.Primary_Project_Demographics__c,
                        record.content.Primary_Project_Demographics_Explanation__c,
                        record.content.Secondary_Project_Demographics__c,
                        record.content.Secondary_Proj_Demographics_Explanation__c,
                        record.content.Tertiary_Project_Demographics__c,
                        record.content.Tertiary_Proj_Demographics_Explanation__c,
                        record.content.Structure_Objectives_of_Asst_Programs__c,
                        record.content.Recipient_Approach_Description__c,
                    ];
                }
                default:
                    return null;
            }
        })
        .filter(isNotNull);
}

async function generateExpendituresGT50000(records) {
    return records.map((record) => {
        switch (record.type) {
            case 'expenditures50k': {
                return [
                    null, // first col is blank
                    record.content.Sub_Award_Lookup__c,
                    record.content.Expenditure_Start__c,
                    record.content.Expenditure_End__c,
                    currency(record.content.Expenditure_Amount__c),
                ];
            }
            default:
                return null;
        }
    }).filter(isNotNull);
}

async function generateExpendituresLT50000(records) {
    return records.map((record) => {
        switch (record.type) {
            case 'awards':
                if (record.content.Sub_Award_Type_Aggregates_SLFRF__c === PAYMENTS_TO_INDIVIDUALS) {
                    return null;
                }

                return [
                    null, // first col is blank
                    record.content.Project_Identification_Number__c,
                    record.content.Sub_Award_Type_Aggregates_SLFRF__c,
                    currency(record.content.Quarterly_Obligation_Amt_Aggregates__c),
                    currency(record.content.Quarterly_Expenditure_Amt_Aggregates__c),
                ];
            default:
                return null;
        }
    }).filter(isNotNull);
}

async function generatePaymentsIndividualsLT50000(records) {
    return records.map((record) => {
        switch (record.type) {
            case 'awards':
                if (record.content.Sub_Award_Type_Aggregates_SLFRF__c !== PAYMENTS_TO_INDIVIDUALS) {
                    return null;
                }

                return [
                    null, // first col is blank
                    record.content.Project_Identification_Number__c,
                    currency(record.content.Quarterly_Obligation_Amt_Aggregates__c),
                    currency(record.content.Quarterly_Expenditure_Amt_Aggregates__c),
                ];
            default:
                return null;
        }
    }).filter(isNotNull);
}

async function generateSubaward(records) {
    return records.map((record) => {
        switch (record.type) {
            case 'awards50k': {
                return [
                    null, // first col is blank
                    record.content.Recipient_UEI__c,
                    tin(record.content.Recipient_EIN__c),
                    record.content.Project_Identification_Number__c,
                    record.content.Award_No__c,
                    record.content.Entity_Type_2__c,
                    record.content.Award_Type__c,
                    currency(record.content.Award_Amount__c),
                    record.content.Award_Date__c,
                    record.content.Primary_Sector__c,
                    record.content.If_Other__c,
                    record.content.Period_of_Performance_Start__c,
                    record.content.Period_of_Performance_End__c,
                    record.content.Place_of_Performance_Address_1__c,
                    record.content.Place_of_Performance_Address_2__c,
                    record.content.Place_of_Performance_Address_3__c,
                    record.content.Place_of_Performance_City__c,
                    record.content.State_Abbreviated__c,
                    zip(record.content.Place_of_Performance_Zip__c),
                    zip4(record.content.Place_of_Performance_Zip_4__c),
                    record.content.Purpose_of_Funds__c,
                    record.content.Description__c,
                ];
            }
            default:
                return null;
        }
    }).filter(isNotNull);
}

async function generateSubRecipient(records, periodId) {
    const subrecipients = await listRecipientsForReportingPeriod(periodId);

    return subrecipients.map((subrecipient) => {
        const record = JSON.parse(subrecipient.record);
        return [
            null, // first col is blank
            record.Unique_Entity_Identifier__c,
            tin(record.EIN__c),
            null, // TODO: Update reporting to include Recipient_Profile_Id__c if it exists/is known
            record.Name,
            multiselect(record.Entity_Type_2__c),
            record.POC_Email_Address__c,
            record.Address__c,
            record.Address_2__c,
            record.Address_3__c,
            record.City__c,
            record.State_Abbreviated__c,
            zip(record.Zip__c),
            zip4(record.Zip_4__c),
            record.Country__c,
            capitalizeFirstLetter(record.Registered_in_Sam_gov__c),
            record.Federal_Funds_80_or_More_of_Revenue__c,
            record.Derives_25_Million_or_More_from_Federal__c,
            currency(record.Total_Compensation_for_Officers_Public__c),
            record.Officer_Name__c,
            currency(record.Officer_Total_Comp__c),
            record.Officer_2_Name__c,
            currency(record.Officer_2_Total_Comp__c),
            record.Officer_3_Name__c,
            currency(record.Officer_3_Total_Comp__c),
            record.Officer_4_Name__c,
            currency(record.Officer_4_Total_Comp__c),
            record.Officer_5_Name__c,
            currency(record.Officer_5_Total_Comp__c),
        ];
    });
}

async function setCSVData(data) {
    const {
        csvObject, admZip, records, periodId,
    } = data;
    const { name, func } = csvObject;
    const csvData = await func(records, periodId);

    if (!Array.isArray(csvData)) {
        console.dir({ name, func });
        console.dir(csvData);
        throw new Error(`CSV Data from ${name} was not an array!`);
    }

    // ignore empty CSV files
    if (csvData.length === 0) {
        return;
    }

    const template = await getTemplate(name);

    // 2022-09-29
    // The treasury portal csv parser doesn't adhere to correct semantics for parsing some line
    // ending characters. To correct for that, we'll strip any of this problematic characters out
    // of the export. The csv upload validator doesn't depend on any of the values with linebreaks
    // so this doesn't break parsing, though it might cause minor formatting differences in the
    // downloaded exports.
    const escapedContent = [...template, ...csvData].map((row) => row.map((value) => (typeof value === 'string' ? value.replace(/\r\n|\r|\n/g, ' -- ') : value)));
    const sheet = XLSX.utils.aoa_to_sheet(escapedContent, { dateNF: 'MM/DD/YYYY' });
    const csvString = XLSX.utils.sheet_to_csv(sheet, { RS: '\r\n' });
    const buffer = Buffer.from(BOM + csvString, 'utf8');

    admZip.addFile(`${name}.csv`, buffer);
}

async function generateReport(periodId, tenantId) {
    requiredArgument(tenantId, 'must specify tenantId');
    requiredArgument(periodId, 'must specify periodId');
    const records = await recordsForReportingPeriod(periodId, tenantId);

    // generate every csv file for the report
    const csvObjects = [
        { name: 'project111210BulkUpload', func: generateProject111210 },
        { name: 'project18_229233BulkUpload', func: generateProject18 },
        { name: 'project19_234BulkUpload', func: generateProject19 },
        { name: 'project211214BulkUpload', func: generateProject211214 },
        { name: 'project2128BulkUpload', func: generateProject2128 },
        { name: 'project215218BulkUpload', func: generateProject215218 },
        { name: 'project224227BulkUpload', func: generateProject224227 },
        { name: 'project236BulkUpload', func: generateProject236 },
        { name: 'project31BulkUpload', func: generateProject31 },
        { name: 'project32BulkUpload', func: generateProject32 },
        { name: 'project4142BulkUpload', func: generateProject4142 },
        { name: 'project51518BulkUpload', func: generateProject51518 },
        { name: 'project519521BulkUpload', func: generateProject519521 },
        { name: 'projectBaselineBulkUploadTemplate', func: generateProjectBaseline },
        {
            name: 'expendituresGT50000BulkUpload',
            func: generateExpendituresGT50000,
        },
        {
            name: 'expendituresLT50000BulkUpload',
            func: generateExpendituresLT50000,
        },
        {
            name: 'paymentsIndividualsLT50000BulkUpload',
            func: generatePaymentsIndividualsLT50000,
        },
        { name: 'subawardBulkUpload', func: generateSubaward },
        { name: 'subRecipientBulkUpload', func: generateSubRecipient },
    ];

    const admZip = new AdmZip();

    const reportName = await generateReportName(periodId, tenantId);

    // compute the CSV data for each file, and write it into the zip container
    const inputs = [];
    csvObjects.forEach((c) => inputs.push({
        csvObject: c, admZip, records, periodId,
    }));
    await asyncBatch(inputs, setCSVData, 2);

    // return the correct format
    return {
        filename: `${reportName}.zip`,
        content: admZip.toBuffer(),
    };
}

module.exports = {
    generateReport,
};

// NOTE: This file was copied from src/server/services/generate-arpa-report.js (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z
