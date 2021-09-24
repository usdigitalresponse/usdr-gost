const express = require('express');

const router = express.Router();
const db = require('../db');
const { requireAdminUser, requireUser, isAuthorized } = require('../lib/access-helpers');

router.get('/', requireUser, async (req, res) => {
    const user = await db.getUser(req.signedCookies.userId);

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

    const elegibilityCodes = await db.getAgencyEligibilityCodes(agency);
    console.log(`${JSON.stringify(elegibilityCodes)}`);
    res.json(elegibilityCodes);
});

router.put('/:code/enable/:value', requireAdminUser, async (req, res) => {
    const user = await db.getUser(req.signedCookies.userId);

    // Agency to determine update may be in query string.
    let { agency } = req.query;
    if (agency) {
        // Is this admin user authorized for that agency ?
        const authorized = await isAuthorized(req.signedCookies.userId, Number(agency));
        if (!authorized) return res.sendStatus(403);
    } else {
        // Agency not in query string, so use this user's agency.
        agency = user.agency_id;
    }
    const result = await db.setAgencyEligibilityCodeEnabled(req.params.code, agency, req.params.value === 'true');
    res.json(result);
});

module.exports = router;
