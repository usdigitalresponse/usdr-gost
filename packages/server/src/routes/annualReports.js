const express = require('express');
const multer = require('multer');

const router = express.Router({ mergeParams: true });
const { requireUser } = require('../lib/access-helpers');
const {
    ArpaDocumentBuilder,
    loadBufferToWorkbook,
    parseDataFromWorkbook,
} = require('../lib/annualReports');

const upload = multer({ storage: multer.memoryStorage() });

router.post('/', requireUser, upload.array('files'), (req, res) => {
    const reportData = {};
    req.files.forEach((f) => {
        const book = loadBufferToWorkbook(f.buffer);
        parseDataFromWorkbook(book, reportData);
    });

    const document = new ArpaDocumentBuilder(reportData).buildReportDocument();

    return ArpaDocumentBuilder.documentToBuffer(document)
        .then((buffer) => res.status(201).send(buffer))
        .catch((err) => {
            console.log('error? ', err);
            res.status(500).send(err);
        });
});

module.exports = router;
