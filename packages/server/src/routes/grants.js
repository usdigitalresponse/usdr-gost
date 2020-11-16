const express = require('express');

const router = express.Router();
const { getGrants, markGrantAsViewed } = require('../db');

router.get('/', async (req, res) => {
    const grants = await getGrants(req.query);
    res.json(grants);
});

router.put('/:grantId/view/:agencyId', async (req, res) => {
    const { agencyId, grantId } = req.params;
    await markGrantAsViewed({ grantId, agencyId });
    res.json({});
});

module.exports = router;
