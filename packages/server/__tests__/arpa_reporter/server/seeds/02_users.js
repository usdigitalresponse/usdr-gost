require('dotenv').config();

const _ = require('lodash');
const { isRunningInGOST } = require('../helpers/is_gost');

const adminList = (process.env.INITIAL_ADMIN_EMAILS || '').split(/\s*,\s*/).filter(_.identity);
const agencyUserList = (process.env.INITIAL_AGENCY_EMAILS || '').split(
    /\s*,\s*/,
).filter(_.identity);

const agencies = {
    accountancy: {
        id: 0,
        abbreviation: 'SBA',
        code: 'SBA',
        name: 'State Board of Accountancy',
        parent: null,
        tenant_id: 0,
    },
};

const unitTestUsers = [
    {
        email: 'mbroussard+unit-test-admin@usdigitalresponse.org',
        name: 'Unit Test Admin 1',
        role: 'admin',
        tenant_id: 0,
        agency_id: 0,
    },
    {
        email: 'mbroussard+unit-test-user2@usdigitalresponse.org',
        name: 'Unit Test User 2',
        role: 'reporter',
        tenant_id: 1,
        agency_id: 0,
    },
];

// To allow this seed to run in both legacy ARPA Reporter repo and GOST, we must account for slightly
// different format and names of role field on users
function reformatUserRoleForGost(user, roles) {
    const adminRole = roles.find((role) => role.name === 'admin');
    const staffRole = roles.find((role) => role.name === 'staff');
    if (!adminRole || !staffRole) {
        throw new Error('expected admin and staff role to exist in GOST');
    }

    return {
        ..._.omit(user, 'role'),
        role_id: user.role === 'admin' ? adminRole.id : staffRole.id,
    };
}

exports.seed = async function (knex) {
    const isGost = await isRunningInGOST(knex);

    // Deletes ALL existing users
    // TODO(mbroussard): moot since mocha_wrapper.sh deletes and recreates the DB?
    await knex('users')
        .del();

    const roles = await knex('roles').select('*');
    await knex('agencies').insert(Object.values(agencies));
    const users = [
    // Fixed test users specified in this file
        ...unitTestUsers,
        // Test users specified by environment variable
        // TODO(mbroussard): why does this exist if this seed is only used for tests?
        ...adminList.map((email) => ({
            email, name: email, role: 'admin', tenant_id: 0,
        })),
        ...agencyUserList.map((email) => ({
            email, name: email, role: 'reporter', tenant_id: 0,
        })),
    ].map((user) => (isGost ? reformatUserRoleForGost(user, roles) : user));

    await knex('users').insert(users);
};

// NOTE: This file was copied from tests/server/seeds/02_users.js (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z
