const express = require('express');

const router = express.Router();
const db = require('../db');
const { requireAdminUser, requireUser } = require('../lib/access-helpers');

router.get('/', requireUser, async (req, res) => {
    let { agency } = req.query;
    if (!agency) {
        // Agency not in query string, so use this user's agency.
        const user = await db.getUser(req.signedCookies.userId);
        agency = user.agency_id;
    }

    const elegibilityCodes = await db.getAgencyEligibilityCodes(agency);
    res.json(elegibilityCodes);
});

router.put('/:code/enable/:value', requireAdminUser, async (req, res) => {
    let { agency } = req.query;
    if (!agency) {
        // Agency not in query string, so use this user's agency.
        const user = await db.getUser(req.signedCookies.userId);
        agency = user.agency_id;
    }

    const result = await db.setAgencyEligibilityCodeEnabled(req.params.code, agency, req.params.value === 'true');
    res.json(result);
});

module.exports = router;
