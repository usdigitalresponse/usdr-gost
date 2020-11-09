const express = require('express');

const router = express.Router();
const { getKeywords } = require('../db');

router.get('/', async (req, res) => {
    console.log('GET /keywords');
    const keywords = await getKeywords();
    res.json(keywords);
});

module.exports = router;
