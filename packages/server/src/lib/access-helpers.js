const { getUser, getTenant, getAgency } = require('../db');

class AgencyTenantMismatchError extends Error {
  // ...
}

function isPartOfAgency(agencies, agencyId) {
    return agencies.find((s) => s.id === Number(agencyId));
}

async function validateAgencyPartOfTenant(tenantId, agencyId) {
    console.log('validate 1');
    const agency = await getAgency(agencyId)
    const tenant = await getTenant(tenantId)

    console.log('validate 2');
    if (agency.tenant_id !== tenant.id) {
        throw new AgencyTenantMismatchError()
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

    if (user.role_name == 'admin') {
        return isPartOfAgency(user.agency.subagencies, agencyId);
    } else if (user.role_name == 'staff') {
        return user.agency_id === agencyId
    }
}

async function requireAdminUser(req, res, next) {
    console.log('admin 1');
    if (!req.signedCookies.userId) {
        res.sendStatus(403);
        return;
    }
    console.log('admin 2');

    const user = await getUser(req.signedCookies.userId);
    if (user.role_name !== 'admin') {
        res.sendStatus(403);
        return;
    }

    console.log('admin 3');
    const paramAgencyId = req.params.organizationId;

    const requestAgency = Number(paramAgencyId);

    if (!Number.isNaN(requestAgency)) {

        console.log('admin 4');
        try { await validateAgencyPartOfTenant(user.tenant_id, requestAgency)
        } catch(e) {
            console.log(e);
            if (e instanceof AgencyTenantMismatchError) {
                res.sendStatus(403);
                return;
            } else {
                res.sendStatus(500);
                return;
            }
        }

        console.log('admin 5');

        const authorized = await isAuthorized(req.signedCookies.userId, requestAgency);
        if (!authorized) {
            res.sendStatus(403);
            return;
        }

        console.log('admin 6');
        req.session = { ...req.session, user, selectedAgency: requestAgency };
    } else {
        // Redundant because user's agency and user's tenant should never be different
        // but still fine to check it since that's the agency we're going to end up using for querying

        console.log('admin 7');
        try { await validateAgencyPartOfTenant(user.tenant_id, user.agency_id)
        } catch(e) {
            if (e instanceof AgencyTenantMismatchError) {
                res.sendStatus(403);
            } else {
                res.sendStatus(500);
            }
        }
        req.session = { ...req.session, user, selectedAgency: user.agency_id };
    }

    console.log('admin 8');
    next();
}

async function requireUser(req, res, next) {

    console.log('we are here 1');
    if (!req.signedCookies.userId) {
        res.sendStatus(403);
        return;
    }
    console.log('we are here 2');

    const user = await getUser(req.signedCookies.userId);
    if (req.params.organizationId && user.role_name === 'staff' && (req.params.organizationId !== user.agency_id.toString())) {
        res.sendStatus(403); // Staff are restricted to their own agency.
        return;
    }

    console.log('we are here 3');

    // User NOT required to be admin; but if they ARE, they must satisfy admin rules.
    if (user.role_name === 'admin') {
        await requireAdminUser(req, res, next);
        return;
    }

    console.log('we are here 4');

    const paramAgencyId = req.params.organizationId;
    const requestAgency = Number(paramAgencyId);

    console.log('we are here');

    if (!Number.isNaN(requestAgency)) {
        try { await validateAgencyPartOfTenant(user.tenant_id, requestAgency)
        } catch(e) {
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
    try { await validateAgencyPartOfTenant(user.tenant_id, user.agency_id)
    } catch(e) {
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
