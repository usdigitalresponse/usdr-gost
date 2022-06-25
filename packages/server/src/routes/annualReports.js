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
    // fake like it's a list for dev
    const workbooks = [AnnualReports.loadBufferToWorkbook(req.files[0].buffer)];
    const report = AnnualReports.buildReportFromWorkbooks(workbooks);
    // const projectData = workbook.Sheets['Project Data'];
    // If this cell says "Expenditure Data" then it's the generic template
    // const isGeneric = projectData.B19.v === 'Expenditure Data';
    // console.log('In that cell: ', projectData.B19.v);

    // You'll need 1 parser for the generic template and 1 for the Tulsa template
    // Each will have to return the same interface for ease of document generation
    // may want a lodash.get here, looks like this repo doesn't have ?. support
    // console.log('This should be 25k: ', projectData.K25.v);
    // res.json('all wired up');

    // sending as a buffer works on browser side
    return AnnualReports.giveBuffer()
        .then((buffer) => {
            return res.status(201).send(buffer);
        })
        .catch((err) => {
            console.log('error? ', err);
            res.status(500).send('OH NO');
        });
});

module.exports = router;

/*
    TODO: define an interface for the document generation flow
    you need 1 parser for the generic and 1 for Tulsa's specific template
    they should both return the same interface for ease of use with the document generator
*/
