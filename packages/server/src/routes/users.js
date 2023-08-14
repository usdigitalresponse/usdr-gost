const express = require('express');

const router = express.Router({ mergeParams: true });
const multer = require('multer');

const multerUpload = multer({ storage: multer.memoryStorage() });
const XLSX = require('xlsx');
const moment = require('moment');
const { ensureAsyncContext } = require('../arpa_reporter/lib/ensure-async-context');
const {
    requireAdminUser,
    requireUser,
    isAuthorized,
    isUserAuthorized,
    isUSDRSuperAdmin,
    requireUSDRSuperAdminUser,
} = require('../lib/access-helpers');
const email = require('../lib/email');
const db = require('../db');
const UserImporter = require('../lib/userImporter');
const { emailSubscriptionStatus, notificationType } = require('../lib/email/constants');

router.post('/', requireAdminUser, async (req, res, next) => {
    const { user } = req.session;
    if (!req.body.email) {
        res.status(400).send('User email is required');
        return;
    }

    let agencyId = user.agency_id;
    if (Number.isFinite(req.body.agency)) {
        agencyId = req.body.agency;
    }

    try {
        const allowed = await isUserAuthorized(user, agencyId);
        if (!allowed) {
            res.status(403).send('Cannot assign user to agency outside of the tenant');
            return;
        }
        const newUser = {
            email: req.body.email.toLowerCase(),
            name: req.body.name,
            role_id: req.body.role,
            agency_id: agencyId,
            tenant_id: user.tenant_id,
        };
        const result = await db.createUser(newUser);
        res.json({ user: result });

        const domain = process.env.WEBSITE_DOMAIN || req.headers.origin;
        await email.sendWelcomeEmail(newUser.email, domain);
    } catch (e) {
        if (e.message.match(/violates unique constraint/)) {
            console.log(e.message);
            res.status(400).send('User with that email already exists');
        } else {
            next(e);
        }
    }
});

router.put('/:userId/email_subscription', requireUser, async (req, res) => {
    const agencyId = parseInt(req.params.organizationId, 10);
    const userId = parseInt(req.params.userId, 10);
    const { user } = req.session;

    if (
        user.role_name === 'admin'
        && parseInt(user.agency.id, 10) !== agencyId
        && !isUSDRSuperAdmin(user)
    ) {
        /*
            Non-USDR admin-users are not allowed to update other users' subscriptions.
            Even if the agency is a sub-agency of the admin user's agency.
        */
        res.sendStatus(403);
        return;
    }

    const { preferences } = req.body;

    try {
        await db.setUserEmailSubscriptionPreference(userId, agencyId, preferences);
        res.status(200).json({ message: 'Successfully updated preferences.' });
    } catch (e) {
        console.error(`Unable to update agency email preferences for user: ${userId} agency: ${agencyId} preferences: ${preferences} error: ${e}`);
        res.status(500).json({ message: 'Something went wrong while updating preferences. Please try again or reach out to support.' });
    }
});

router.get('/:userId/sendDigestEmail', requireUSDRSuperAdminUser, async (req, res) => {
    const user = await db.getUser(req.params.userId);
    if (user.emailPreferences[notificationType.grantDigest] !== emailSubscriptionStatus.subscribed) {
        res.sendStatus(400).json({ message: `User ${user.id} is not subscribed to grant digest emails` });
        return;
    }

    try {
        const savedSearches = await db.getSavedSearches(user.id, {});
        const promises = [];
        for (const search of savedSearches.data) {
            let criteriaObj;
            try {
                criteriaObj = JSON.parse(search.criteria);
            } catch (e) {
                console.error(`Could not parse ${search}: due to error '${e}}' stack: ${e.stack}`);
            }
            if (criteriaObj !== undefined) {
                const yesterday = req.query.date ? new Date(req.query.date) : moment().subtract(1, 'day').format('YYYY-MM-DD');

                // Only 30 grants are shown on any given email and 31 will trigger a place to click to see more
                /* eslint-disable no-await-in-loop */
                const { data } = await db.getNewGrantsForSavedSearch(user.tenant_id, criteriaObj, { perPage: 31 }, yesterday);
                /* eslint-enable no-await-in-loop */

                promises.push(email.sendGrantDigest({
                    openDate: yesterday,
                    name: search.name,
                    recipients: [user.email],
                    matchedGrants: data,
                }));
            }
        }
        await Promise.all(promises);
    } catch (e) {
        console.error(`Unable to kick-off digest email for user '${user.id}' due to error '${e}}' stack: ${e.stack}`);
        res.sendStatus(500).json({ message: 'Something went wrong while kicking off the digest email. Please investigate the server logs.' });
        return;
    }
    res.sendStatus(200);
});

router.get('/', requireAdminUser, async (req, res) => {
    const users = await db.getUsers(req.session.user.tenant_id);
    res.json(users);
});

router.delete('/:userId', requireAdminUser, async (req, res) => {
    const userToDelete = await db.getUser(req.params.userId);

    // Is this admin user able to delete a user in their agency
    const authorized = await isAuthorized(req.signedCookies.userId, userToDelete.agency_id);
    if (!authorized) {
        res.sendStatus(403);
        return;
    }

    const deleteCount = await db.deleteUser(req.params.userId);
    if (deleteCount === 1) {
        res.json({});
    } else {
        res.status(400).send('No such user');
    }
});

router.post(
    '/import',
    requireAdminUser,
    ensureAsyncContext(multerUpload.single('spreadsheet')),
    async (req, res) => {
        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const rowsList = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
        const domain = process.env.WEBSITE_DOMAIN || req.headers.origin;
        const ret = await (new UserImporter()).import(
            req.session.user,
            rowsList,
            domain,
        );
        res.status(200).json({ ret, error: null });
    },
);

module.exports = router;
