const express = require('express');

const router = express.Router();
const grantscraper = require('../lib/grantscraper');

router.get('/grants', async (req, res) => {
    console.log('GET /refresh/grants');
    res.status(202).send();
    grantscraper.run();
});

module.exports = router;
