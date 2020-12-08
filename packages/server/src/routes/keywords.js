const express = require('express');

const router = express.Router();
const { getAgencyKeywords, getUser } = require('../db');

router.get('/', async (req, res) => {
    const user = await getUser(req.signedCookies.userId);
    const keywords = await getAgencyKeywords(user.agency.id);
    res.json(keywords);
});

module.exports = router;
