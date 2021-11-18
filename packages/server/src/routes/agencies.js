const express = require('express');

const router = express.Router({ mergeParams: true });
const { requireAdminUser, requireUser } = require('../lib/access-helpers');
const {
    getAgency, getAgencies, setAgencyThresholds,
} = require('../db');

router.get('/', requireUser, async (req, res) => {
    const { user } = req.session;
    let response;
    if (user.role.name === 'admin') {
        response = await getAgencies(req.session.selectedAgency);
    } else {
        response = await getAgency(req.session.selectedAgency);
    }
    res.json(response);
});

router.put('/:agency', requireAdminUser, async (req, res) => {
    // Currently, agencies are seeded into db; only thresholds are mutable.
    const { agency } = req.params;

    const { warningThreshold, dangerThreshold } = req.body;
    const result = await setAgencyThresholds(agency, warningThreshold, dangerThreshold);
    res.json(result);
});

module.exports = router;
