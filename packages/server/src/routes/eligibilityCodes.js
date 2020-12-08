const express = require('express');

const router = express.Router();
const { getUser, getAgencyEligibilityCodes } = require('../db');

router.get('/', async (req, res) => {
    const user = await getUser(req.signedCookies.userId);
    const elegibilityCodes = await getAgencyEligibilityCodes(user.agency.id);
    res.json(elegibilityCodes);
});

module.exports = router;
