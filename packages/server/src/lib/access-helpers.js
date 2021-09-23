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
    return user.agency.subagencies.indexOf(agencyId) >= 0;
}

async function requireUser(req, res, next) {
    if (!req.signedCookies.userId) {
        res.sendStatus(403);
        return;
    }

    const user = await getUser(req.signedCookies.userId);
    if (user.role_name === 'staff' && req.query.agency) {
        res.sendStatus(403); // Staff may not change agency using query string
        return;
    }
    next();
}

async function requireAdminUser(req, res, next) {
    if (!req.signedCookies.userId) {
        res.sendStatus(403);
        return;
    }

    const user = await getUser(req.signedCookies.userId);
    if (user.role_name !== 'admin') {
        res.sendStatus(403);
    } else {
        next();
    }
}

module.exports = {
    requireAdminUser, requireUser, isAuthorized,
};
