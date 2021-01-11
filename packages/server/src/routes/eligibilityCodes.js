const express = require('express');

const router = express.Router();
const db = require('../db');
const { requireAdminUser } = require('../lib/access-helpers');

router.get('/', async (req, res) => {
    const user = await db.getUser(req.signedCookies.userId);
    const elegibilityCodes = await db.getAgencyEligibilityCodes(user.agency.id);
    res.json(elegibilityCodes);
});

router.put('/:code/enable/:value', requireAdminUser, async (req, res) => {
    const user = await db.getUser(req.signedCookies.userId);
    const result = await db.setAgencyEligibilityCodeEnabled(req.params.code, user.agency.id, req.params.value === 'true');
    res.json(result);
});

module.exports = router;
