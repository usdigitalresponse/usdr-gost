const express = require('express');

const router = express.Router();
const { requireAdminUser } = require('../lib/access-helpers');
const { createUser } = require('../db');

router.post('/', requireAdminUser, (req, res, next) => {
    console.log('POST /users');
    console.log(req.body);
    const { email, role, agency_id } = req.body;
    if (!email) {
        res.status(400).send('User email is required');
        return;
    }
    const user = {
        email: req.body.email.toLowerCase(),
        role,
        agency_id,
    };
    createUser(user)
        .then((result) => res.json({ user: result }))
        .catch((e) => {
            if (e.message.match(/violates unique constraint/)) {
                res.status(400).send('User with that email already exists');
            } else {
                next(e);
            }
        });
});

module.exports = router;
