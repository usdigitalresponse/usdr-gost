require('dotenv').config();

const agencies = require('./ref/agencies');
const roles = require('./ref/roles');
const eligibilityCodes = require('./ref/eligibilityCodes');
const interestedCodes = require('./ref/interestedCodes');
const keywords = require('./ref/keywords');

// const adminList = (process.env.INITIAL_ADMIN_EMAILS || '').split(/\s*,\s*/).filter((s) => s);
// const agencyUserList = (process.env.INITIAL_AGENCY_EMAILS || '').split(
//     /\s*,\s*/,
// ).filter((s) => s);

const procurementAgency = agencies.find((a) => a.id === 113);
const usdrAgency = agencies.find((a) => a.abbreviation === 'USDR');

const adminList = [
    // {
    //     email: 'rafael.pol+admin_admin@protonmail.com',
    //     name: 'rafa1',
    //     agency_id: agencies[1].id,
    //     role_id: roles[0].id,
    // },
    // {
    //     email: 'bindu+admin_admin@usdigitalresponse.org',
    //     name: 'bindu',
    //     agency_id: agencies[1].id,
    //     role_id: roles[0].id,
    // },
    // {
    //     email: 'rafael.pol+admin_sba@protonmail.com',
    //     name: 'rafa1',
    //     agency_id: agencies[0].id,
    //     role_id: roles[0].id,
    // },
    {
        email: 'bindu@usdigitalresponse.org',
        name: 'Bindu Gakhar',
        agency_id: usdrAgency.id,
        role_id: roles[0].id,
    },
    {
        email: 'dang.alex@gmail.com',
        name: 'Alex Dang',
        agency_id: usdrAgency.id,
        role_id: roles[0].id,
    },
    {
        email: 'rafael.pol@protonmail.com',
        name: 'Rafael Pol',
        agency_id: usdrAgency.id,
        role_id: roles[0].id,
    },
    {
        email: 'jsotak@admin.nv.gov',
        name: 'Jovon Sotak',
        agency_id: procurementAgency.id,
        role_id: roles[0].id,
    },
];
const agencyUserList = [
    // {
    //     email: 'rafael.pol+staff_asd@protonmail.com',
    //     name: 'rafa2',
    //     agency_id: agencies[2].id,
    //     role_id: roles[1].id,
    // },
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
    await knex('users').insert(agencyUserList)
        .onConflict('email')
        .merge();

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
