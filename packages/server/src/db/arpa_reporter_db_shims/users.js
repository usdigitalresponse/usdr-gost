// This file exists as a shim to replace ARPA Reporter's db/users.js
// Eventually, the functions in this file should have callsites updated to use GOST's existing methods
// and this file can be deleted.

const knex = require('../connection');
const gostDb = require('..');

// TODO(mbroussard): after merge, replace with an import to ARPA's use-request module
function useTenantId() {
    throw new Error('import missing -- need to update after ARPA merge');
}

async function users() {
    const tenantId = useTenantId();
    const tenant = await knex('tenants')
        .where('id', tenantId)
        .select('*')
        .then((rows) => rows[0]);
    const mainAgencyId = tenant.main_agency_id;

    return gostDb.getUsers(mainAgencyId);
}

function createUser(u) {
    const tenantId = useTenantId();
    return gostDb.createUser({ ...u, tenant_id: tenantId });
}

function updateUser(u) {
    // TODO(mbroussard): should we make this throw instead? GOST doesn't currently allow any of these
    // to be modified.

    const update = {
        email: u.email,
        name: u.name,
        agency_id: u.agency_id,
    };
    if (u.role && u.role.id) {
        update.role_id = u.role.id;
    }

    return knex('users')
        .where('id', u.id)
        .update(update)
        .returning('*')
        .then((rows) => rows[0]);
}

async function userAndRole(id) {
    return gostDb.getUser(id);
}

function user(id) {
    return userAndRole(id);
}

function roles() {
    return gostDb.getRoles();
}

function accessToken() {
    throw new Error('this should not be called; use GOST access-helpers/sessions instead');
}

function markAccessTokenUsed() {
    throw new Error('this should not be called; use GOST access-helpers/sessions instead');
}

function createAccessToken() {
    throw new Error('this should not be called; use GOST access-helpers/sessions instead');
}

module.exports = {
    accessToken,
    createAccessToken,
    createUser,
    markAccessTokenUsed,
    roles,
    updateUser,
    user,
    userAndRole,
    users,
};
