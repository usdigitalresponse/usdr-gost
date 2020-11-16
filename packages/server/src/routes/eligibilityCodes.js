const express = require('express');

const router = express.Router();
const { getElegibilityCodes } = require('../db');

router.get('/', async (req, res) => {
    const elegibilityCodes = await getElegibilityCodes();
    res.json(elegibilityCodes);
});

module.exports = router;
