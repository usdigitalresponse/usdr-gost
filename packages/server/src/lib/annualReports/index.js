const XLSX = require('xlsx');
const { giveBuffer } = require('./doc-builder');
const buildReportFromWorkbooks = require('./reportBuilder');

function loadBufferToWorkbook(buffer) {
    return XLSX.read(buffer);
}

// need to define an interface you can feed to whatever docx lib you end up using
module.exports = {
    buildReportFromWorkbooks,
    loadBufferToWorkbook,
    giveBuffer,
};
