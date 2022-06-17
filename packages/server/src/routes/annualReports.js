const express = require('express');
const multer = require('multer');

const router = express.Router({ mergeParams: true });
const { requireUser } = require('../lib/access-helpers');
const AnnualReports = require('../lib/annualReports');

const upload = multer({ storage: multer.memoryStorage() });

// Should this be an admin user?
router.post('/', requireUser, upload.array('files'), (req, res) => {
    req.files.forEach((f) => {
        console.log(f);
    });

    // just do dev for 1 file for now
    const workbook = AnnualReports.loadBufferToWorkbook(req.files[0].buffer);
    const projectData = workbook.Sheets['Project Data'];

    // may want a lodash.get here, looks like this repo doesn't have ?. support
    console.log('This should be 25k: ', projectData.K25.v);
    res.json('all wired up');
});

module.exports = router;

/*
    TODO: define an interface for the document generation flow
    the input shape is likely to change after Tulsa so you need something
    fairly generic or easy to transform into
*/
