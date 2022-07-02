const XLSX = require('xlsx');
const ArpaDocumentBuilder = require('./doc-builder');
const parseDataFromWorkbooks = require('./reportBuilder');

function loadBufferToWorkbook(buffer) {
    return XLSX.read(buffer);
}

module.exports = {
    ArpaDocumentBuilder,
    loadBufferToWorkbook,
    parseDataFromWorkbooks,
};
