const express = require('express');

const router = express.Router({ mergeParams: true });
const db = require('../db');
const { requireUser } = require('../lib/access-helpers');

router.get('/', requireUser, async (req, res) => {
    const { user } = req.session;

    const paginationParams = {
        currentPage: req.query.currentPage || 1,
        perPage: req.query.perPage || 10,
        isLengthAware: req.query.isLengthAware || true,
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
        if (e.constraint && e.constraint.includes('grants_saved_searches_name_created_by_idx')) {
            console.warn(e);
            res.status(400).send(`Title '${req.body.name}' already exists`);
            return;
        }
        console.error(e);
        res.status(500).send('Unable to create saved search. Please reach out to grants-helpdesk@usdigitalresponse.org');
    }
});

router.put('/:searchId', requireUser, async (req, res) => {
    const { user } = req.session;

    try {
        const result = await db.updateSavedSearch({
            id: req.params.searchId,
            name: req.body.name,
            userId: user.id,
            criteria: req.body.criteria,
        });

        res.json(result);
    } catch (e) {
        console.error(e);
        res.status(500).send('Unable to update saved search. Please reach out to grants-helpdesk@usdigitalresponse.org');
    }
});

router.delete('/:searchId', requireUser, async (req, res) => {
    const { searchId } = req.params;
    const { user } = req.session;

    let deleteSuccess = false;

    try {
        deleteSuccess = await db.deleteSavedSearch(searchId, user.id);
    } catch (e) {
        console.error(`Error deleting saved search: ${e}`);
        res.status(500).send('Error deleting saved search');
        return;
    }

    if (deleteSuccess) {
        res.status(200).json({ status: 'OK' });
    } else {
        res.status(404).send('Could not find the saved search');
    }
});

module.exports = router;
