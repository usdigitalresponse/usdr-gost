const express = require('express');

const router = express.Router({ mergeParams: true });
const db = require('../db');
const { requireUser, isUserAuthorized } = require('../lib/access-helpers');

router.get('/:agencyId', requireUser, async (req, res) => {
    const { agencyId } = req.params;
    const { user } = req.session;

    const authorized = await isUserAuthorized(user, agencyId);
    if (!authorized) {
        res.sendStatus(403);
        return;
    }

    const paginationParams = {
        currentPage: req.params.currentPage || 1,
        perPage: req.params.perPage || 10,
        isLengthAware: req.params.isLengthAware || true,
    };

    const savedSearches = await db.getSavedSearches(user.id, agencyId, paginationParams);

    res.json(savedSearches);
});

router.post('/:agencyId', requireUser, async (req, res) => {
    const { agencyId } = req.params;
    const { user } = req.session;

    const authorized = await isUserAuthorized(user, agencyId);
    if (!authorized) {
        res.sendStatus(403);
        return;
    }

    try {
        const result = await db.createSavedSearch({
            name: req.body.name,
            agencyId,
            userId: user.id,
            criteria: req.body.criteria,
        });

        res.json(result);
    } catch (e) {
        res.status(500).send('Unable to create saved search. Please reach out to grants-helpdesk@usdigitalresponse.org');
    }
});

router.delete('/:agencyId/:searchId', requireUser, async (req, res) => {
    const { agencyId, searchId } = req.params;
    const { user } = req.session;
    console.log('here');
    const authorized = await isUserAuthorized(user, agencyId);
    if (!authorized) {
        res.sendStatus(403);
        return;
    }

    const toDelete = await db.getSavedSearch(searchId, agencyId);
    if (!toDelete) {
        res.sendStatus(400).send('Could not find the saved search');
        return;
    }

    const success = await db.deleteSavedSearch(toDelete.id, toDelete.agency_id);

    if (success) {
        res.status(200).send('OK');
    } else {
        res.status(400).send('Failed to delete the saved search');
    }
});

module.exports = router;
