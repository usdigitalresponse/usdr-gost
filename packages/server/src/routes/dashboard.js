const express = require('express');

const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
    const result = {};
    if (req.query.totalGrants) {
        result.totalGrants = await db.getTotalGrants();
    }
    if (req.query.totalViewedGrants) {
        result.totalViewedGrants = await db.getTotalViewedGrants();
    }
    if (req.query.totalInterestedGrants) {
        result.totalInterestedGrants = await db.getTotalInteresedGrants();
    }
    if (req.query.totalInterestedGrantsByAgencies) {
        result.totalInterestedGrantsByAgencies = await db.getTotalInterestedGrantsByAgencies();
    }
    if (req.query.totalGrantsBetweenDates) {
        const dates = req.query.totalGrantsBetweenDates.split('|');
        if (dates.length === 2) {
            result.totalGrantsBetweenDates = await db.getTotalGrantsBetweenDates(
                dates[0],
                dates[1],
            );
        }
    }
    res.json(result);
});

module.exports = router;
