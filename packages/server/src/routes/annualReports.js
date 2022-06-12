const express = require('express');
const multer = require('multer');

const router = express.Router({ mergeParams: true });
const { requireUser } = require('../lib/access-helpers');
const upload = multer({ storage: multer.memoryStorage() });

// Should this be an admin user?
router.post('/', requireUser, upload.array('files'), (req, res) => {
    // const { user } = req.session;
    console.log('Hallelujah the files: ', req.files);
    // let response;
    // if (user.role.name === 'admin') {
    //     response = await getAgencies(req.session.selectedAgency);
    // } else {
    //     response = await getAgency(req.session.selectedAgency);
    // }
    res.json('all wired up');
});

// router.put('/:agency', requireAdminUser, async (req, res) => {
//     // Currently, agencies are seeded into db; only thresholds are mutable.
//     const { agency } = req.params;
//
//     const { warningThreshold, dangerThreshold } = req.body;
//     const result = await setAgencyThresholds(agency, warningThreshold, dangerThreshold);
//     res.json(result);
// });
//
// router.post('/', requireAdminUser, async (req, res) => {
//     const { user } = req.session;
//     if (!isPartOfAgency(user.agency.subagencies, req.body.parentId)) {
//         throw new Error(`You dont have access parent agency`);
//     }
//     const agency = {
//         name: req.body.name,
//         abbreviation: req.body.abbreviation,
//         parent: Number(req.body.parentId),
//         warning_threshold: Number(req.body.warningThreshold),
//         danger_threshold: Number(req.body.dangerThreshold),
//     };
//     const parentAgency = await getAgency(agency.parent);
//     if (!parentAgency) {
//         throw new Error(`Agency ${agency.parent} not found`);
//     }
//     const result = await createAgency(agency);
//
//     res.json(result);
// });
//
module.exports = router;
