const { getUser } = require('../db');

/**
 * Determine if a user is authorized for an agency.
 *
 * @param {Number} userId
 * @param {Number} agencyId
 * @returns {Boolean} true if the agency is the user's or a descendant; false otherwise
 */
async function isAuthorized(userId, agencyId) {
    const user = await getUser(userId);
    return user.agency.subagencies.includes(agencyId);
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

    // Depending on the request, an agency ID may be specified in zero or one of:
    //  the query string: ?agency=...
    //  a route parameter :agency
    //  a route parameter :agencyId
    //  a body field named 'agency'
    const queryAgency = Number(req.query.agency);
    const paramAgency = Number(req.params.agency);
    const paramAgencyId = Number(req.params.agencyId);
    const bodyAgency = Number(req.body.agency);

    let count = 0;
    if (!Number.isNaN(queryAgency)) count += 1;
    if (!Number.isNaN(paramAgency)) count += 1;
    if (!Number.isNaN(paramAgencyId)) count += 1;
    if (!Number.isNaN(bodyAgency)) count += 1;

    if (count > 1) {
        res.sendStatus(400); // ambiguous request
        return;
    } if (count === 1) {
        // Is this user an admin of the specified agency?
        const requestAgency = queryAgency || paramAgency || paramAgencyId || bodyAgency || 0;
        const authorized = await isAuthorized(req.signedCookies.userId, requestAgency);
        if (!authorized) {
            res.sendStatus(403);
            return;
        }
        req.session = { ...req.session, agency: requestAgency };
    } else {
        // no agency was specified; default to user's own agency
        req.session = { ...req.session, agency: user.agency_id };
    }

    next();
}

async function requireUser(req, res, next) {
    if (!req.signedCookies.userId) {
        res.sendStatus(403);
        return;
    }

    const user = await getUser(req.signedCookies.userId);
    if (req.query.agency && user.role_name === 'staff') {
        res.sendStatus(403); // Staff are restricted to their own agency.
        return;
    }
    req.session = { ...req.session, agency: user.agency_id };

    // User NOT required to be admin; but if they ARE, they must satisfy admin rules.
    if (user.role_name === 'admin') {
        await requireAdminUser(req, res, next);
        return;
    }

    next();
}

module.exports = {
    requireAdminUser, requireUser, isAuthorized,
};
