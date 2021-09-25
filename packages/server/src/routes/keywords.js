const express = require('express');

const router = express.Router();
const { requireAdminUser, requireUser, isAuthorized } = require('../lib/access-helpers');
const db = require('../db');

router.post('/', requireAdminUser, async (req, res) => {
    const keyword = {
        search_term: req.body.searchTerm,
        mode: '',
        notes: req.body.notes,
        agency_id: req.body.agency_id,
    };

    const result = await db.createKeyword(keyword);
    res.json(result);
});

router.delete('/:keywordId', requireAdminUser, async (req, res) => {
    // Get agency of keyword to be deleted.
    const { agency_id } = await db.getKeyword(req.params.keywordId);

    // Is this admin user authorized for that agency?
    const authorized = await isAuthorized(req.signedCookies.userId, agency_id);
    if (!authorized) {
        res.sendStatus(403);
        return;
    }

    const deleteCount = await db.deleteKeyword(req.params.keywordId);
    if (deleteCount === 1) {
        res.json({});
    } else {
        res.status(400).send('No such keyword');
    }
});

router.get('/', requireUser, async (req, res) => {
    let { agency } = req.query;
    if (!agency) {
        // Agency not in query string, so default to this user's agency.
        const user = await db.getUser(req.signedCookies.userId);
        agency = user.agency_id;
    }

    const keywords = await db.getAgencyKeywords(agency);
    res.json(keywords);
});

module.exports = router;
