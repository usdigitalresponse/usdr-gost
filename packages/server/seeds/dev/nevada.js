/**
 * seed file for specific tenant
 * will seed tenant and admin for a new tenant. Go to render=> dashboard => shell
 * and run
 * npx knex seed:run --specific=nevada.js --env envinronment-goes-here
 * to seed the tenant.
 */

const tenants = [
    {
        id: 5,
        display_name: 'TEST -- Multi-Tenant Nevada Tenant',
        // main_agency_id: 400,
    },
];

const agencies = [
    {
        id: 400,
        abbreviation: 'TMNT',
        name: 'TEST -- Multi-Tenant Nevada Test Agency',
        parent: 0,
        main_agency_id: 400,
        tenant_id: 5,
    },
];

const users = [
    {
        email: 'grants.dev+nv@usdigitalresponse.org',
        name: 'Nevada Multi-Tenant Admin',
        agency_id: 400,
        role_id: 1,
        tenant_id: 5,
    },
];
exports.seed = async (knex) => {
    await knex('tenants').insert(tenants);
    await knex('agencies').insert(agencies);
    await knex('users').insert(users);

    await knex('tenants').where('id', 5).update({ main_agency_id: 400 });
};
