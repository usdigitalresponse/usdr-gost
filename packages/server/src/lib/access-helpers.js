const { getUser, isSubOrganization } = require('../db');

async function checkOrganization(req) {
    const user = await getUser(req.signedCookies.userId);
    if (!user.agency) { // USDR
        return user.role_name;
    }
    if (user.agency.id === req.headers.organization) {
        return user.role_name;
    }

    if (await isSubOrganization(user.agency.id, req.headers.organization)) {
        return user.role_name;
    }
    return false;
}

async function requireUser(req, res, next) {
    if (!req.signedCookies.userId) {
        res.sendStatus(403);
        return;
    }
    const role = await checkOrganization(req);
    if (!role) {
        res.sendStatus(403);
        return;
    }
    next();
}

async function requireAdminUser(req, res, next) {
    if (!req.signedCookies.userId) {
        res.sendStatus(403);
    } else {
        const role_name = await checkOrganization(req);
        if (role_name !== 'admin') {
            res.sendStatus(403);
        } else {
            next();
        }
    }
}

module.exports = { requireAdminUser, requireUser };
