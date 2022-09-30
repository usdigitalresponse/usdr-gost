const { getUser, inTenant } = require('../db');

const USDR_TENANT_ID = 1;
const USDR_AGENCY_ID = 0;
const USDR_EMAIL_DOMAIN = 'usdigitalresponse.org';
function isUSDRSuperAdmin(user) {
    // Note: this function assumes an augmented user object from db.getUser(), not just a raw DB row
    // (necessary for role_name field)
    return (
        user.tenant_id === USDR_TENANT_ID
        && user.agency_id === USDR_AGENCY_ID
        && user.role_name === 'admin'
        // TODO: Right now there are a bunch of non-USDR users in USDR tenant in prod, so we need to
        // restrict this further. But this will also prevent USDR volunteers from having this permission.
        && user.email.endsWith(`@${USDR_EMAIL_DOMAIN}`)
    );
}

/**
 * Determine if a user is authorized for an agency.
 *
 * @param {Object} user
 * @param {...Number} agencyIds
 * @returns {Boolean} true if the agency is in the same tenant as the user
 * */
async function isUserAuthorized(user, ...agencyIds) {
    return inTenant(user.id, user.tenant_id, agencyIds);
}

async function isAuthorized(userId, agencyId) {
    const user = await getUser(userId);
    return isUserAuthorized(user, agencyId);
}

async function requireAdminUser(req, res, next) {
    if (!req.signedCookies.userId) {
        res.sendStatus(403);
        return;
    }

    const user = await getUser(req.signedCookies.userId);
    if (!user) {
        res.sendStatus(403);
        return;
    }

    if (user.role_name !== 'admin') {
        res.sendStatus(403);
        return;
    }
    const paramAgencyId = req.params.organizationId;

    const requestAgency = Number(paramAgencyId);

    if (!Number.isNaN(requestAgency)) {
        const authorized = await isUserAuthorized(user, requestAgency);
        if (!authorized) {
            res.sendStatus(403);
            return;
        }
        req.session = { ...req.session, user, selectedAgency: requestAgency };
    } else {
        req.session = { ...req.session, user, selectedAgency: user.agency_id };
    }

    next();
}

async function requireUser(req, res, next) {
    if (!req.signedCookies.userId) {
        res.sendStatus(403);
        return;
    }

    const user = await getUser(req.signedCookies.userId);
    if (!user) {
        res.sendStatus(403);
        return;
    }

    if (req.params.organizationId && user.role_name === 'staff' && (req.params.organizationId !== user.agency_id.toString())) {
        res.sendStatus(403); // Staff are restricted to their own agency.
        return;
    }

    // User NOT required to be admin; but if they ARE, they must satisfy admin rules.
    if (user.role_name === 'admin') {
        await requireAdminUser(req, res, next);
        return;
    }

    req.session = { ...req.session, user, selectedAgency: user.agency_id };

    next();
}

async function requireUSDRSuperAdminUser(req, res, next) {
    await requireAdminUser(req, res, () => {
        if (!isUSDRSuperAdmin(req.session.user)) {
            res.sendStatus(403);
            return;
        }

        next();
    });
}

module.exports = {
    requireAdminUser, requireUser, isAuthorized, isUserAuthorized, isUSDRSuperAdmin, requireUSDRSuperAdminUser,
};
