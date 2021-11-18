const { getUser } = require('../db');

function isPartOfAgency(agencies, agencyId) {
    return agencies.find((s) => s.id === Number(agencyId));
}

/**
 * Determine if a user is authorized for an agency.
 *
 * @param {Number} userId
 * @param {Number} agencyId
 * @returns {Boolean} true if the agency is the user's or a descendant; false otherwise
 */
async function isAuthorized(userId, agencyId) {
    const user = await getUser(userId);
    return isPartOfAgency(user.agency.subagencies, agencyId);
}

async function requireAdminUser(req, res, next) {
    if (!req.signedCookies.userId) {
        res.sendStatus(403);
        return;
    }

    const user = await getUser(req.signedCookies.userId);
    if (user.role_name !== 'admin') {
        res.sendStatus(403);
        return;
    }
    const paramAgencyId = req.params.organizationId;

    const requestAgency = Number(paramAgencyId);

    if (!Number.isNaN(requestAgency)) {
        const authorized = await isAuthorized(req.signedCookies.userId, requestAgency);
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

module.exports = {
    requireAdminUser, requireUser, isAuthorized, isPartOfAgency,
};
