const express = require('express');

const router = express.Router({ mergeParams: true });
const { requireAdminUser, requireUser, isAuthorized } = require('../lib/access-helpers');
const db = require('../db');

router.post('/', requireAdminUser, async (req, res) => {
    const result = await db.createKeyword({
        search_term: req.body.searchTerm,
        mode: '',
        notes: req.body.notes,
        agency_id: req.session.selectedAgency,
    });

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
    const keywords = await db.getAgencyKeywords(req.session.selectedAgency);
    res.json(keywords);
});

module.exports = router;
