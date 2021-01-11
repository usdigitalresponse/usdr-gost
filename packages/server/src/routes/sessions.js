const express = require('express');
const _ = require('lodash-checkit');
const { sendPasscode } = require('../lib/email');

const router = express.Router();
const {
    getUser,
    getAccessToken,
    createAccessToken,
    markAccessTokenUsed,
} = require('../db');

router.get('/', async (req, res) => {
    const { passcode } = req.query;
    if (passcode) {
        const token = await getAccessToken(passcode);
        if (!token) {
            console.log('invalid passcode');
            res.redirect('/login');
        } else {
            await markAccessTokenUsed(passcode);
            res.cookie('userId', token.user_id, { signed: true });
            res.redirect(process.env.WEBSITE_DOMAIN || '/');
        }
    } else if (req.signedCookies && req.signedCookies.userId) {
        const user = await getUser(req.signedCookies.userId);
        res.json({ user });
    } else {
        res.json({ message: 'No session' });
    }
});

router.get('/logout', (req, res) => {
    res.clearCookie('userId');
    res.json({});
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
        const apiDomain = process.env.API_DOMAIN || req.headers.origin;
        await sendPasscode(email, passcode, apiDomain);
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
