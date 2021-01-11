const { getUser } = require('../db');

function requireUser(req, res, next) {
    if (!req.signedCookies.userId) {
        res.sendStatus(403);
    } else {
        next();
    }
}

async function requireAdminUser(req, res, next) {
    if (!req.signedCookies.userId) {
        res.sendStatus(403);
    } else {
        const user = await getUser(req.signedCookies.userId);
        if (user.role_name !== 'admin') {
            res.sendStatus(403);
        } else {
            next();
        }
    }
}

module.exports = { requireAdminUser, requireUser };
