const express = require('express');

const router = express.Router();
const { requireAdminUser } = require('../lib/access-helpers');
const db = require('../db');

router.get('/', requireAdminUser, async (req, res) => {
    const result = await db.getRoles();
    res.json(result);
});

module.exports = router;
