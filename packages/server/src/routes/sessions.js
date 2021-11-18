/* eslint-disable import/no-unresolved */
const express = require('express');
const _ = require('lodash-checkit');
const { sendPasscode } = require('../lib/email');

const router = express.Router({ mergeParams: true });
const {
    getUser,
    getAccessToken,
    createAccessToken,
    incrementAccessTokenUses,
    markAccessTokenUsed,
} = require('../db');

// the validation URL is sent in the authentication email:
//     http://localhost:3000/api/sessions/?passcode=97fa7091-77ae-4905-b62e-97a7b4699abd
//
router.get('/', async (req, res) => {
    const { passcode } = req.query;
    if (passcode) {
        const token = await getAccessToken(passcode);
        if (!token) {
            res.redirect(`/#/login?message=${encodeURIComponent('Invalid access token')}`);
        } else if (new Date() > token.expires) {
            res.redirect(
                `/#/login?message=${encodeURIComponent('Access token has expired')}`,
            );
        } else if (token.used) {
            res.redirect(`/#/login?message=${encodeURIComponent(
                'Login link has already been used - please re-submit your email address',
            )}`);
        } else {
            const uses = await incrementAccessTokenUses(passcode);
            if (uses > 1) {
                await markAccessTokenUsed(passcode);
            }
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

// eslint-disable-next-line consistent-return
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
