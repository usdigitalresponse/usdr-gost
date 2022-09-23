const express = require('express');

const router = express.Router({ mergeParams: true });
const db = require('../db');
const { requireUser } = require('../lib/access-helpers');

router.get('/', requireUser, async (req, res) => {
    const result = {};
    let agencyCriteria;
    const { selectedAgency } = req.session;

    if (req.query.totalGrants || req.query.grantsCreatedFromTs || req.query.grantsUpdatedFromTs) {
        agencyCriteria = await db.getAgencyCriteriaForAgency(selectedAgency);
    }

    if (req.query.totalGrants) {
        result.totalGrants = await db.getTotalGrants();
        result.totalGrantsMatchingAgencyCriteria = await db.getTotalGrants({ agencyCriteria });
    }
    if (req.query.totalViewedGrants) {
        result.totalViewedGrants = await db.getTotalViewedGrants();
    }
    if (req.query.totalInterestedGrants) {
        result.totalInterestedGrants = await db.getTotalInterestedGrants(selectedAgency);
    }
    if (req.query.totalInterestedGrantsByAgencies) {
        result.totalInterestedGrantsByAgencies = await db.getTotalInterestedGrantsByAgencies(selectedAgency);
    }
    if (req.query.grantsCreatedFromTs) {
        const fromTs = req.query.grantsCreatedFromTs;

        result.grantsCreatedInTimeframe = await db.getTotalGrants({
            createdTsBounds: { fromTs },
        });

        result.grantsCreatedInTimeframeMatchingCriteria = await db.getTotalGrants({
            createdTsBounds: { fromTs },
            agencyCriteria,
        });
    }
    if (req.query.grantsUpdatedFromTs) {
        const fromTs = req.query.grantsUpdatedFromTs;

        result.grantsUpdatedInTimeframe = await db.getTotalGrants({
            updatedTsBounds: { fromTs },
        });

        result.grantsUpdatedInTimeframeMatchingCriteria = await db.getTotalGrants({
            updatedTsBounds: { fromTs },
            agencyCriteria,
        });
    }
    res.json(result);
});

module.exports = router;
