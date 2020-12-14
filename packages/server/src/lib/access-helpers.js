const { getUser } = require('../db');

function requireUser(req, res, next) {
    if (!req.signedCookies.userId) {
        res.sendStatus(403);
    } else {
        next();
    }
}

function requireAdminUser(req, res, next) {
    if (!req.signedCookies.userId) {
        res.sendStatus(403);
    } else {
        getUser(req.signedCookies.userId).then((user) => {
            if (user.role_name !== 'admin') {
                res.sendStatus(403);
            } else {
                next();
            }
        });
    }
}

module.exports = { requireAdminUser, requireUser };
