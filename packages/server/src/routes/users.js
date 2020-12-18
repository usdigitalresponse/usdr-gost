const express = require('express');

const router = express.Router();
const { requireAdminUser } = require('../lib/access-helpers');
const db = require('../db');

router.post('/', requireAdminUser, (req, res, next) => {
    if (!req.body.email) {
        res.status(400).send('User email is required');
        return;
    }
    const user = {
        email: req.body.email.toLowerCase(),
        name: req.body.name,
        role_id: req.body.role,
        agency_id: req.body.agency,
    };
    db.createUser(user)
        .then((result) => res.json({ user: result }))
        .catch((e) => {
            if (e.message.match(/violates unique constraint/)) {
                res.status(400).send('User with that email already exists');
            } else {
                next(e);
            }
        });
});

router.get('/', requireAdminUser, (req, res) => {
    db.getUsers()
        .then((result) => res.json(result));
});

router.delete('/:userId', requireAdminUser, (req, res) => {
    db.deleteUser(req.params.userId)
        .then((result) => res.json(result));
});

module.exports = router;
