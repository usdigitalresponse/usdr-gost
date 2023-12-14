const express = require('express');

const router = express.Router({ mergeParams: true });
const { fundingActivityCategories } = require('../lib/fieldConfigs/fundingActivityCategories');
const db = require('../db');
const { requireUser } = require('../lib/access-helpers');

router.get('/', requireUser, async (req, res) => {
    const eligibilityCodes = await db.getAgencyEligibilityCodes(req.session.selectedAgency);
    eligibilityCodes.forEach((ec) => {
        delete ec.created_at;
        delete ec.updated_at;
    });
    res.json({ eligibilityCodes, fundingActivityCategories });
});

module.exports = router;
