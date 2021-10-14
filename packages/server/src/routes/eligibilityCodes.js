const express = require('express');

const router = express.Router();
const db = require('../db');
const { requireAdminUser, requireUser } = require('../lib/access-helpers');

router.get('/', requireUser, async (req, res) => {
    const elegibilityCodes = await db.getAgencyEligibilityCodes(req.session.agency);
    res.json(elegibilityCodes);
});

router.put('/:code/enable/:value', requireAdminUser, async (req, res) => {
    const result = await db.setAgencyEligibilityCodeEnabled(req.params.code, req.session.agency, req.params.value === 'true');
    res.json(result);
});

module.exports = router;
