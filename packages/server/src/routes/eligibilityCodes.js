const express = require('express');

const router = express.Router({ mergeParams: true });
const db = require('../db');
const { requireUser } = require('../lib/access-helpers');

router.get('/', requireUser, async (req, res) => {
    const eligibilityCodes = await db.getAgencyEligibilityCodes(req.session.selectedAgency);
    eligibilityCodes.forEach((ec) => {
        delete ec.created_at;
        delete ec.updated_at;
    });
    res.json(eligibilityCodes);
});

router.put('/:code/enable/:value', requireUser, async (req, res) => {
    const result = await db.setAgencyEligibilityCodeEnabled(req.params.code, req.session.selectedAgency, req.params.value === 'true');
    res.json(result);
});

module.exports = router;
