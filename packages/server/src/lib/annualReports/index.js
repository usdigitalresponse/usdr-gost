const XLSX = require('xlsx');
const giveBuffer = require('./doc-builder').giveBuffer;

const TEST_FILE_NAME = 'OH test data 5.11- ARPA SFRF Reporting Workbook v20220320.xlsm';
const TEST_FILE_NAME_2 = 'OH test data 5.3- ARPA SFRF Reporting Workbook v20220320.xlsm';
const TEST_FILE_NAME_3 = 'RI 4.2-SFRF Test Reporting DCYF Provider Workforce Stabilization Premium Pay.xlsm';
const INFRA_SHEET_NAME = 'EC 5 - Infrastructure';

// Stolen from arpa-reporter lib/spreadsheet.js
function loadSpreadsheet(filename) {
    const workbook = XLSX.readFile(filename);
    return workbook.SheetNames.map((sheetName) => {
        const sheet = workbook.Sheets[sheetName];
        return {
            sheetName,
            data: XLSX.utils.sheet_to_json(sheet, { header: 1 })
        };
    });
};

const loadWorkbook = (filename) => XLSX.readFile(filename);

function loadBufferToWorkbook(buffer) {
    return XLSX.read(buffer);
}

// const infrastructure = workbook.Sheets[INFRA_SHEET_NAME];
// Actually returns an array of objects, not strictly json
const sheetToFormattedJson = (sheet) => {
// This gives very nice output, but you're going to want to make a findHeaderRow()
// and not just assume that 10 is right, the sheet design is still in flux
    return XLSX.utils.sheet_to_json(sheet, { range: 10 });
};

// get the headers here
/*
> Object.keys(sheet[1])
  [
    'Project Expenditure Category',
    'Project Name',
    'Project Identification Number\r\n(Assigned by recipient)',
    'Status of Completion',
    'Adopted Budget',
    'Total \r\nObligations',
    'Total \r\nExpenditures',  // probably gonna want to sanitize this for safety
    'Project Description',
    'Program Income Earned',
    'Program Income Expended',
    'Projected/actual construction start date',
    'Projected/actual initiation of operations date',
    'Location (for broadband, geospatial location data)',
    'Location Details',
    'Public Water System (PWS) ID number (if applicable',
    'Median Household Income of service area',
    'Lowest Quintile Income of the service area'
  ]
*/

// need to define an interface you can feed to whatever docx lib you end up using
module.exports = {
    loadSpreadsheet,
    loadWorkbook,
    loadBufferToWorkbook,
    sheetToFormattedJson,
    giveBuffer,
};
