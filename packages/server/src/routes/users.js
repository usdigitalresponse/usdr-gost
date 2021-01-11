const express = require('express');

const router = express.Router();
const { requireAdminUser } = require('../lib/access-helpers');
const { sendWelcomeEmail } = require('../lib/email');
const db = require('../db');

router.post('/', requireAdminUser, async (req, res, next) => {
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
    try {
        const result = await db.createUser(user);
        res.json({ user: result });
        await sendWelcomeEmail(user.email, req.headers.origin);
    } catch (e) {
        if (e.message.match(/violates unique constraint/)) {
            res.status(400).send('User with that email already exists');
        } else {
            next(e);
        }
    }
});

router.get('/', requireAdminUser, async (req, res) => {
    const users = await db.getUsers();
    res.json(users);
});

router.delete('/:userId', requireAdminUser, async (req, res) => {
    await db.deleteUser(req.params.userId);
    res.json({});
});

module.exports = router;
