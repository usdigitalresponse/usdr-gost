const XLSX = require('xlsx');
const ArpaDocumentBuilder = require('./doc-builder');
const { parseDataFromWorkbook } = require('./reportBuilder');

function loadBufferToWorkbook(buffer) {
    return XLSX.read(buffer);
}

module.exports = {
    ArpaDocumentBuilder,
    loadBufferToWorkbook,
    parseDataFromWorkbook,
};
