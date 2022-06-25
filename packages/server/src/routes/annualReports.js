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

    // You'll need 1 parser for the generic template and 1 for the Tulsa template
    // Each will have to return the same interface for ease of document generation
    // may want a lodash.get here, looks like this repo doesn't have ?. support
    // console.log('This should be 25k: ', projectData.K25.v);
    // res.json('all wired up');

    // would it be better to write it as a tempfile and use res.sendFile()?
    // Might make it easier from the browser side
    // Does that even work?
    return AnnualReports.giveBuffer()
        .then((buffer) => {
            console.log('buffer: ', Object.keys(buffer));
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
