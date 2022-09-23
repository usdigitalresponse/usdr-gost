// This file exists as a shim to replace ARPA Reporter's db/users.js
// Eventually, the functions in this file should have callsites updated to use GOST's existing methods
// and this file can be deleted.

const _ = require('lodash');
const knex = require('../connection');
const gostDb = require('..');

const { useTenantId } = require('../../arpa_reporter/use-request');

async function users() {
    const tenantId = useTenantId();
    return gostDb.getUsers(tenantId);
}

function createUser(u) {
    const tenantId = useTenantId();
    return gostDb.createUser({ ..._.omit(u, 'role'), role_id: u.role.id, tenant_id: tenantId });
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
