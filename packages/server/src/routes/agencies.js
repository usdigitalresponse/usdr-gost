const express = require('express');

const router = express.Router();
const { getAgencies } = require('../db');

router.get('/', async (req, res) => {
    const response = await getAgencies();
    res.json(response);
});

module.exports = router;
