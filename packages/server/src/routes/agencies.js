const express = require('express');

const router = express.Router();
const { requireAdminUser, requireUser } = require('../lib/access-helpers');
const {
    getAgency, getAgencies, setAgencyThresholds, getUser,
} = require('../db');

router.get('/', requireUser, async (req, res) => {
    const user = await getUser(req.signedCookies.userId);
    let response;
    if (user.role.name === 'admin') {
        response = await getAgencies(req.session.agency);
    } else {
        response = await getAgency(req.session.agency);
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
