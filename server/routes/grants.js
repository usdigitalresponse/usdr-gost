const express = require('express');

const router = express.Router();
const { getGrants } = require('../db');

router.get('/', async (req, res) => {
    console.log('GET /grants');
    console.log(req.body);
    const grants = await getGrants();
    res.json(grants);
});

module.exports = router;
