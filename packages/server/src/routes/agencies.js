const express = require('express');

const router = express.Router();
const { requireAdminUser } = require('../lib/access-helpers');
const { getAgencies, setAgencyThresholds } = require('../db');

router.get('/', async (req, res) => {
    const response = await getAgencies();
    res.json(response);
});

router.put('/:id', requireAdminUser, async (req, res) => {
    // Currently, agencies are seeded into db; only thresholds are mutable.
    const { id } = req.params;
    const { warningThreshold, dangerThreshold } = req.body;
    const result = await setAgencyThresholds(id, warningThreshold, dangerThreshold);
    res.json(result);
});

module.exports = router;
