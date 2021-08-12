// require('dotenv').config();

const agencies = require('./ref/agencies');
const roles = require('./ref/roles');
const eligibilityCodes = require('./ref/eligibilityCodes');
const interestedCodes = require('./ref/interestedCodes');
const keywords = require('./ref/keywords');

const usdrAgency = agencies.find((a) => a.abbreviation === 'USDR');

const adminList = [
    // Update me with the appropiate initial admin users
    {
        email: 'rafael.pol@protonmail.com',
        name: 'Rafael Pol',
        agency_id: usdrAgency.id,
        role_id: roles[0].id,
    },
];
const agencyUserList = [
    // update me with non admin agency user

];

const globalCodes = [
    '00', '06', '07', '25', '99',
];

exports.seed = async (knex) => {
    const tables = ['agency_eligibility_codes', 'keywords', 'eligibility_codes'];

    // eslint-disable-next-line no-restricted-syntax
    for (const table of tables) {
        // eslint-disable-next-line no-await-in-loop
        await knex(table).del();
    }

    await knex('roles').insert(roles)
        .onConflict('id')
        .merge();
    await knex('agencies').insert(agencies)
        .onConflict('id')
        .merge();
    await knex('users').insert(adminList)
        .onConflict('email')
        .merge();

    if (agencyUserList.length) {
        await knex('users').insert(agencyUserList)
            .onConflict('email')
            .merge();
    }

    await knex('eligibility_codes').insert(eligibilityCodes)
        .onConflict('code')
        .merge();

    await knex('keywords').insert(keywords)
        .onConflict('id')
        .merge();
    await knex('agency_eligibility_codes').insert([].concat(...agencies
        .map(
            (agency) => eligibilityCodes.map((eC) => ({
                agency_id: agency.id, code: eC.code, enabled: globalCodes.includes(eC.code),
            })),
        )))
        .onConflict(['agency_id', 'code'])
        .merge();
    await knex('interested_codes')
        .insert(interestedCodes)
        .onConflict('id')
        .merge();
};
