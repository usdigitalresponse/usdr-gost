const express = require('express');
const _ = require('lodash-checkit');

const router = express.Router();
const {
    getUserAndRole,
    getAccessToken,
    createAccessToken,
    markAccessTokenUsed,
} = require('../db');
const { sendPasscode } = require('../lib/email');

router.get('/', (req, res) => {
    const { passcode } = req.query;
    if (passcode) {
        getAccessToken(passcode).then((token) => {
            if (!token) {
                console.log('invalid passcode');
                res.redirect('/login');
            } else {
                markAccessTokenUsed(passcode).then(() => {
                    res.cookie('userId', token.user_id, { signed: true });
                    res.redirect('/');
                });
            }
        });
    } else if (req.signedCookies.userId) {
        getUserAndRole(req.signedCookies.userId).then((user) => res.json({ user }));
    } else {
        res.json({ message: 'No session' });
    }
});

router.get('/logout', (req, res) => {
    res.clearCookie('userId');
    res.redirect('/login');
});

router.post('/', async (req, res, next) => {
    if (!req.body.email) {
        res.statusMessage = 'No Email Address provided';
        return res.sendStatus(400);
    }
    const email = req.body.email.toLowerCase();
    if (!_.isEmail(email)) {
        res.statusMessage = 'Invalid Email Address';
        return res.sendStatus(400);
    }
    try {
        const passcode = await createAccessToken(email);
        await sendPasscode(email, passcode, req.headers.origin);
        res.json({
            success: true,
            message: `Email sent to ${email}. Check your inbox`,
        });
    } catch (e) {
        if (e.message.match(/User .* not found/)) {
            res.json({
                success: false,
                message: e.message,
            });
        } else {
            next(e);
        }
    }
});

module.exports = router;
