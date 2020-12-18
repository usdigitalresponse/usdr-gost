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
    db.createKeyword(keyword)
        .then((result) => res.json(result));
});

router.delete('/:keywordId', requireAdminUser, (req, res) => {
    db.deleteKeyword(req.params.keywordId)
        .then((result) => res.json(result));
});

router.get('/', async (req, res) => {
    const user = await db.getUser(req.signedCookies.userId);
    const keywords = await db.getAgencyKeywords(user.agency.id);
    res.json(keywords);
});

module.exports = router;
