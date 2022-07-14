const express = require('express');

const router = express.Router({ mergeParams: true });
const { requireAdminUser } = require('../lib/access-helpers');
const db = require('../db');

router.get('/', requireAdminUser, async (req, res) => {
	// Roles are across tenants so this is fine.
    const result = await db.getRoles();
    res.json(result);
});

module.exports = router;
