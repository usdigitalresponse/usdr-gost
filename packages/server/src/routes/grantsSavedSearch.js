const express = require('express');

const router = express.Router({ mergeParams: true });
const db = require('../db');
const { requireUser } = require('../lib/access-helpers');

router.get('/', requireUser, async (req, res) => {
    const { user } = req.session;

    const paginationParams = {
        currentPage: req.params.currentPage || 1,
        perPage: req.params.perPage || 10,
        isLengthAware: req.params.isLengthAware || true,
    };

    const savedSearches = await db.getSavedSearches(user.id, paginationParams);

    res.json(savedSearches);
});

router.post('/', requireUser, async (req, res) => {
    const { user } = req.session;

    try {
        const result = await db.createSavedSearch({
            name: req.body.name,
            userId: user.id,
            criteria: req.body.criteria,
        });

        res.json(result);
    } catch (e) {
        res.status(500).send('Unable to create saved search. Please reach out to grants-helpdesk@usdigitalresponse.org');
    }
});

router.delete('/:searchId', requireUser, async (req, res) => {
    const { searchId } = req.params;
    const { user } = req.session;

    const toDelete = await db.getSavedSearch(searchId);
    if (!toDelete || toDelete.created_by !== user.id) {
        res.sendStatus(400).send('Could not find the saved search');
        return;
    }
    let deleteSuccess = false;

    try {
        deleteSuccess = await db.deleteSavedSearch(toDelete.id);
    } catch (e) {
        console.error(`Error deleting saved search: ${e}`);
        res.status(500).send('Error deleting saved search');
        return;
    }

    if (deleteSuccess) {
        res.status(200).send('OK');
    } else {
        res.status(404).send('Could not find the saved search');
    }
});

module.exports = router;
