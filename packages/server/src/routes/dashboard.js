const express = require('express');

const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
    const result = {};
    let agencyCriteria;
    if (req.query.totalGrants) {
        agencyCriteria = await db.getAgencyCriteriaForUserId(req.signedCookies.userId);
        result.totalGrants = await db.getTotalGrants();
        result.totalGrantsMatchingAgencyCriteria = await db.getTotalGrants({ agencyCriteria });
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
    if (req.query.grantsCreatedFromTs) {
        const fromTs = req.query.grantsCreatedFromTs;
        const criteria = agencyCriteria
            || await db.getAgencyCriteriaForUserId(req.signedCookies.userId);

        result.grantsCreatedInTimeframe = await db.getTotalGrants({
            createdTsBounds: { fromTs },
        });

        result.grantsCreatedInTimeframeMatchingCriteria = await db.getTotalGrants({
            createdTsBounds: { fromTs },
            agencyCriteria: criteria,
        });
    }
    if (req.query.grantsUpdatedFromTs) {
        const fromTs = req.query.grantsUpdatedFromTs;
        const criteria = agencyCriteria
            || await db.getAgencyCriteriaForUserId(req.signedCookies.userId);

        result.grantsUpdatedInTimeframe = await db.getTotalGrants({
            updatedTsBounds: { fromTs },
        });

        result.grantsUpdatedInTimeframeMatchingCriteria = await db.getTotalGrants({
            updatedTsBounds: { fromTs },
            agencyCriteria: criteria,
        });
    }
    res.json(result);
});

module.exports = router;
