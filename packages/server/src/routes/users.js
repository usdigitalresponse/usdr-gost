const express = require('express');

const router = express.Router({ mergeParams: true });
const multer = require('multer');
const moment = require('moment');

const multerUpload = multer({ storage: multer.memoryStorage() });
const XLSX = require('xlsx');
const { ensureAsyncContext } = require('../arpa_reporter/lib/ensure-async-context');
const {
    requireAdminUser,
    requireUser,
    isAuthorizedForAgency,
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
        const allowed = isAuthorizedForAgency(user, agencyId);
        if (!allowed) {
            res.status(403).send('Cannot assign user to a parent agency or agency outside of the tenant');
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

router.patch('/:userId', requireUser, async (req, res) => {
    const id = parseInt(req.params.userId, 10);
    const { user } = req.session;

    const userToEdit = user.id === id ? user : await db.getUser(id);
    const allowed = isAuthorizedForAgency(user, userToEdit.agency_id);
    if (!allowed) {
        res.sendStatus(403);
        return;
    }

    const allowedFields = new Set(['name']);
    for (const key of Object.keys(req.body)) {
        if (!allowedFields.has(key)) {
            res.status(400).json({ message: `Request body contains unsupported field: ${key}` });
            return;
        }
    }

    const { name } = req.body;

    try {
        const result = await db.updateUser({ id, name });
        res.status(200).json({ user: result });
    } catch (err) {
        console.error(`Unable to update name for user: ${id}, error: ${err}`);
        res.status(500).json({ message: 'Something went wrong while updating. Please try again or reach out to support.' });
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
    if (user.emailPreferences[notificationType.grantDigest] === emailSubscriptionStatus.unsubscribed) {
        res.status(400).json({ message: `User ${user.id} is not subscribed to grant digest emails` });
        return;
    }

    try {
        await email.buildAndSendUserSavedSearchGrantDigest(
            user.id,
            req.query.date ? moment(new Date(req.query.date)).format('YYYY-MM-DD') : undefined,
        );
    } catch (e) {
        console.error(`Unable to kick-off digest email for user '${user.id}' due to error '${e}' stack: ${e.stack}`);
        res.status(500).json({ message: 'Something went wrong while kicking off the digest email. Please investigate the server logs.' });
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
    const authorized = isAuthorizedForAgency(req.session.user, userToDelete.agency_id);
    if (!authorized) {
        res.status(403).send('Cannot delete a user from a parent agency or agency outside of the tenant');
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
