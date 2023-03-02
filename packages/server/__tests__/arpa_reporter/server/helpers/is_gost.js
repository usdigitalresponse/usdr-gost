async function isRunningInGOST(knex) {
    // We check if a "tenants" table exists to tell if we're running under GOST or in the legacy arpa-reporter
    // repo.
    const tenantsTable = await knex('pg_tables')
        .where({ schemaname: 'public', tablename: 'tenants' })
        .select('tablename');
    return tenantsTable.length !== 0;
}

module.exports = { isRunningInGOST };

// NOTE: This file was copied from tests/server/helpers/is_gost.js (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z
