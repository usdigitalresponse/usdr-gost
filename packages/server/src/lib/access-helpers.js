const { getUser, inTenant } = require('../db');

// TODO: in prod, there are a bunch of non-USDR looking users set as admin in USDR tenant?
// some are CTG interns, but some are @cityoftulsa.org, @treasury.gov, etc.
// probably need to move them out
const USDR_TENANT_ID = 1;
const USDR_AGENCY_ID = 0;
function isUSDRSuperAdmin(user) {
    // Note: this function assumes an augmented user object from db.getUser(), not just a raw DB row
    return (user.tenant_id === USDR_TENANT_ID && user.agency_id === USDR_AGENCY_ID && user.role_name === 'admin');
}

/**
 * Determine if a user is authorized for an agency.
 *
 * @param {Object} user
 * @param {Number} agencyId
 * @returns {Boolean} true if the agency is in the same tenant as the user
 * */
async function isUserAuthorized(user, agencyId) {
    return inTenant(user.id, user.tenant_id, [agencyId]);
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
