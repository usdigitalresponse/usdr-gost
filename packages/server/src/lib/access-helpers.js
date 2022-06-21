const { getUser, getTenant, getAgency } = require('../db');

class AgencyTenantMismatchError extends Error {
    // ...
}

function isPartOfAgency(agencies, agencyId) {
    return agencies.find((s) => s.id === Number(agencyId));
}

async function validateAgencyPartOfTenant(tenantId, agencyId) {
    const agency = await getAgency(agencyId);
    const tenant = await getTenant(tenantId);

    if (agency.tenant_id !== tenant.id) {
        throw new AgencyTenantMismatchError();
    }
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

    if (user.role_name === 'admin') {
        return isPartOfAgency(user.agency.subagencies, agencyId);
    } if (user.role_name === 'staff') {
        return user.agency_id === agencyId;
    }
    return false;
}

async function requireAdminUser(req, res, next) {
    console.log('requireAdminUser', req.signedCookies);
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
        try {
            await validateAgencyPartOfTenant(user.tenant_id, requestAgency);
        } catch (e) {
            if (e instanceof AgencyTenantMismatchError) {
                res.sendStatus(403);
                return;
            }
            res.sendStatus(500);
            return;
        }

        const authorized = await isAuthorized(req.signedCookies.userId, requestAgency);
        if (!authorized) {
            res.sendStatus(403);
            return;
        }

        req.session = { ...req.session, user, selectedAgency: requestAgency };
    } else {
        // Redundant because user's agency and user's tenant should never be different
        // but still fine to check it since that's the agency we're going to end up using for querying

        try {
            await validateAgencyPartOfTenant(user.tenant_id, user.agency_id);
        } catch (e) {
            if (e instanceof AgencyTenantMismatchError) {
                res.sendStatus(403);
            } else {
                res.sendStatus(500);
            }
        }
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

    const paramAgencyId = req.params.organizationId;
    const requestAgency = Number(paramAgencyId);

    if (!Number.isNaN(requestAgency)) {
        try {
            await validateAgencyPartOfTenant(user.tenant_id, requestAgency);
        } catch (e) {
            if (e instanceof AgencyTenantMismatchError) {
                res.sendStatus(403);
            } else {
                res.sendStatus(500);
            }
        }
        const authorized = await isAuthorized(req.signedCookies.userId, requestAgency);
        if (!authorized) {
            res.sendStatus(403);
            return;
        }
    }

    // Redundant because user's agency and user's tenant should never be different
    // but still fine to check it since that's the agency we're going to end up using for querying
    try {
        await validateAgencyPartOfTenant(user.tenant_id, user.agency_id);
    } catch (e) {
        if (e instanceof AgencyTenantMismatchError) {
            res.sendStatus(403);
        } else {
            res.sendStatus(500);
        }
    }

    req.session = { ...req.session, user, selectedAgency: user.agency_id };

    next();
}

module.exports = {
    requireAdminUser, requireUser, isAuthorized, isPartOfAgency,
};
