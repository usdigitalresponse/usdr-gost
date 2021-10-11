const express = require('express');

const router = express.Router();
const { requireAdminUser, requireUser } = require('../lib/access-helpers');
const {
    getAgency, getAgencies, setAgencyThresholds, getUser,
} = require('../db');

router.get('/', requireUser, async (req, res) => {
    const user = await getUser(req.signedCookies.userId);
    let { agency } = req.query;
    if (!agency) {
        // Agency not in query string, so default to this user's agency.
        agency = user.agency_id;
    }

    let response;
    if (user.role.name === 'admin') {
        response = await getAgencies(agency);
    } else {
        response = await getAgency(agency);
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
