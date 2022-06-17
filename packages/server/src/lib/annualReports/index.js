const XLSX = require('xlsx');
const { giveBuffer } = require('./doc-builder');

// Stolen from arpa-reporter lib/spreadsheet.js
function loadWorkbook(filename) {
    const workbook = XLSX.readFile(filename);
    return workbook.SheetNames.map((sheetName) => {
        const sheet = workbook.Sheets[sheetName];
        return {
            sheetName,
            data: XLSX.utils.sheet_to_json(sheet, { header: 1 }),
        };
    });
}

/* For Dev purposes
const loadWorkbookV2 = (fileName) => XLSX.readFile(fileName);

// function getProjectDataSheet(fileName) {
//     const book = loadWorkbook(fileName);
//     return book.Sheets['Project Data'];
// }
function getSheetByName(book, name) {
    return book.Sheets[name];
}

function gettingExpenditureDataFromProjectDataSheet(individualSheet) {
    return individualSheet.K25;
}
book = loadWorkbookV2()
*/

function loadBufferToWorkbook(buffer) {
    return XLSX.read(buffer);
}

// need to define an interface you can feed to whatever docx lib you end up using
module.exports = {
    loadWorkbook,
    // loadWorkbookV2,
    loadBufferToWorkbook,
    giveBuffer,
};
