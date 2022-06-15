/**
 * seed file for specific tenant
 * will seed tenant and admin for a new tenant. Go to render=> dashboard => shell
 * and run knex seed:run --packages/server/seeds/prod/tenant-nevada.js
 * to seed the tenant.
 */

exports.seed = async (knex) => {
    const tables = ['tenants', 'users'];

    if (tables.includes('tenants')) {
        await knex('tenants').insert([
            {
                id: 384,
                display_name: 'Nevada Tenant',
                main_agency_id: 384,
            },

        ]);
    }

    if (tables.includes('users')) {
        await knex('users').insert([
            {
                email: 'nevada_admin@gmail.com',
                name: 'Nevada Tenant Admin',
                agency_id: 384,
                role_id: 1,
            },
        ]);
    }
};
