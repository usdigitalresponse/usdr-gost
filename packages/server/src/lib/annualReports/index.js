const XLSX = require('xlsx');
const ArpaDocumentBuilder = require('./doc-builder');
const parseDataFromWorkbooks = require('./reportBuilder');

function loadBufferToWorkbook(buffer) {
    return XLSX.read(buffer);
}

// need to define an interface you can feed to whatever docx lib you end up using
module.exports = {
    ArpaDocumentBuilder,
    loadBufferToWorkbook,
    parseDataFromWorkbooks,
};
