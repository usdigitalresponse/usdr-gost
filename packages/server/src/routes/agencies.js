const express = require('express');

const router = express.Router();
const { requireAdminUser, requireUser, isAuthorized } = require('../lib/access-helpers');
const { getAgencies, setAgencyThresholds, getUser } = require('../db');

router.get('/', requireUser, async (req, res) => {
    const user = await getUser(req.signedCookies.userId);

    // Agency to filter results may be in query string.
    let { agency } = req.query;
    if (agency) {
        // Is this admin user authorized for that agency ?
        // (This user must be admin; requireUser 403's staff with agency query string.)
        const authorized = await isAuthorized(req.signedCookies.userId, Number(agency));
        if (!authorized) return res.sendStatus(403);
    } else {
        // Agency not in query string, so use this user's agency.
        agency = user.agency_id;
    }

    const response = await getAgencies(agency);
    res.json(response);
});

router.put('/:id', requireAdminUser, async (req, res) => {
    // Currently, agencies are seeded into db; only thresholds are mutable.
    const { id } = req.params;

    // Is this admin user authorized for that agency ?
    const authorized = await isAuthorized(req.signedCookies.userId, Number(id));
    if (!authorized) return res.sendStatus(403);

    const { warningThreshold, dangerThreshold } = req.body;
    const result = await setAgencyThresholds(id, warningThreshold, dangerThreshold);
    res.json(result);
});

module.exports = router;
