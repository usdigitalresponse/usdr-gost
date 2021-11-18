const express = require('express');

const router = express.Router({ mergeParams: true });
const grantscraper = require('../lib/grantscraper');

router.get('/grants', async (req, res) => {
    res.status(202).send();
    grantscraper.run();
});

module.exports = router;
