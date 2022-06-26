const express = require('express');
const multer = require('multer');

const router = express.Router({ mergeParams: true });
const { requireUser } = require('../lib/access-helpers');
const {
    ArpaDocumentBuilder,
    loadBufferToWorkbook,
    parseDataFromWorkbooks,
} = require('../lib/annualReports');

const upload = multer({ storage: multer.memoryStorage() });

// Should this be an admin user?
router.post('/', requireUser, upload.array('files'), (req, res) => {
    // Load all the buffers into workbooks
    // This could definitely be done more efficiently but should be fine for this use case
    const workbooks = req.files.map((f) => loadBufferToWorkbook(f.buffer));
    const reportData = parseDataFromWorkbooks(workbooks);
    const document = new ArpaDocumentBuilder(reportData).buildReportDocument();

    return ArpaDocumentBuilder.documentToBuffer(document)
        .then((buffer) => {
            return res.status(201).send(buffer);
        })
        .catch((err) => {
            console.log('error? ', err);
            res.status(500).send('OH NO');
        });
});

module.exports = router;
