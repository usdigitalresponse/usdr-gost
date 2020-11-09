const express = require('express');

const router = express.Router();
const { getElegibilityCodes } = require('../db');

router.get('/', async (req, res) => {
    console.log('GET /eligibility-codes');
    const elegibilityCodes = await getElegibilityCodes();
    res.json(elegibilityCodes);
});

module.exports = router;
