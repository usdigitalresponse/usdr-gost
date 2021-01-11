const express = require('express');

const router = express.Router();
const { requireAdminUser } = require('../lib/access-helpers');
const db = require('../db');

router.post('/', requireAdminUser, async (req, res) => {
    const user = await db.getUser(req.signedCookies.userId);

    const keyword = {
        search_term: req.body.searchTerm,
        mode: '',
        notes: req.body.notes,
        agency_id: user.agency.id,
    };
    const result = await db.createKeyword(keyword);
    res.json(result);
});

router.delete('/:keywordId', requireAdminUser, async (req, res) => {
    await db.deleteKeyword(req.params.keywordId);
    res.json({});
});

router.get('/', async (req, res) => {
    const user = await db.getUser(req.signedCookies.userId);
    const keywords = await db.getAgencyKeywords(user.agency.id);
    res.json(keywords);
});

module.exports = router;
