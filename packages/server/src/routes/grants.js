const express = require('express');

const router = express.Router();
const {
    getGrants, markGrantAsViewed, getUser, getAgencyEligibilityCodes, getAgencyKeywords,
} = require('../db');

router.get('/', async (req, res) => {
    const user = await getUser(req.signedCookies.userId);
    const eligibilityCodes = await getAgencyEligibilityCodes(user.agency.id);
    const keywords = await getAgencyKeywords(user.agency.id);
    console.log({ user });
    console.log({ eligibilityCodes, keywords });
    const grants = await getGrants({
        ...req.query,
        filters: {
            eligibilityCodes: eligibilityCodes.map((c) => c.code),
            keywords: keywords.map((c) => c.search_term),
        },
    });
    res.json(grants);
});

router.put('/:grantId/view/:agencyId', async (req, res) => {
    const { agencyId, grantId } = req.params;
    await markGrantAsViewed({ grantId, agencyId });
    res.json({});
});

module.exports = router;
