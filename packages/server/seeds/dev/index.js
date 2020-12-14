require('dotenv').config();

const agencies = require('./ref/agencies');
const roles = require('./ref/roles');
const eligibilityCodes = require('./ref/eligibilityCodes');
const keywords = require('./ref/keywords');

// const adminList = (process.env.INITIAL_ADMIN_EMAILS || '').split(/\s*,\s*/).filter((s) => s);
// const agencyUserList = (process.env.INITIAL_AGENCY_EMAILS || '').split(
//     /\s*,\s*/,
// ).filter((s) => s);

const adminList = [
    {
        email: 'rafael.pol+admin_admin@protonmail.com',
        name: 'rafa1',
        agency_id: agencies[1].id,
        role_id: roles[0].id,
    },
    {
        email: 'bindu+admin_admin@usdigitalresponse.org',
        name: 'bindu',
        agency_id: agencies[1].id,
        role_id: roles[0].id,
    },
    {
        email: 'rafael.pol+admin_sba@protonmail.com',
        name: 'rafa1',
        agency_id: agencies[0].id,
        role_id: roles[0].id,
    },
];
const agencyUserList = [
    {
        email: 'rafael.pol+staff_asd@protonmail.com',
        name: 'rafa2',
        agency_id: agencies[2].id,
        role_id: roles[1].id,
    },
];

exports.seed = async (knex) => {
    const tables = ['agency_eligibility_codes', 'keywords', 'eligibility_codes', 'roles', 'access_tokens', 'users', 'agencies'];

    Promise.all(tables.map((table) => knex(table).del()));

    await knex('roles').insert(roles);
    await knex('agencies').insert(agencies);
    await knex('users').insert(adminList);
    await knex('users').insert(agencyUserList);

    await knex('eligibility_codes').insert(eligibilityCodes);

    await knex('keywords').insert(keywords);
    await knex('agency_eligibility_codes').insert(eligibilityCodes.map((e) => ({
        agency_id: agencies[1].id, code: e.code, enabled: true,
    })));
};
