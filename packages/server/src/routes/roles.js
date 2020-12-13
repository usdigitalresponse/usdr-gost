const express = require('express');

const router = express.Router();
const { requireAdminUser } = require('../lib/access-helpers');
const db = require('../db');

router.get('/', requireAdminUser, (req, res) => {
    db.getRoles()
        .then((result) => res.json(result));
});

module.exports = router;
