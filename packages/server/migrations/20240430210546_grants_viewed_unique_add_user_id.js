// We want to be able to track whether a grant is viewed on a per-user basis (plus, ensure a grant
// doesn't lose its viewed status when a user is deleted, and avoid 500s when a second user views),
// so we're adding user_id to the compound PK for the table.

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
    // Knex builder doesn't support `CONCURRENTLY` or `USING INDEX` as options, so we use raw SQL
    await knex.raw(`
        CREATE UNIQUE INDEX CONCURRENTLY idx_grants_viewed_grant_id_agency_id_user_id_unique 
            ON grants_viewed (grant_id, agency_id, user_id)
    `);
    await knex.raw(`
        ALTER TABLE grants_viewed 
            DROP CONSTRAINT grants_viewed_pkey,
            ADD CONSTRAINT grants_viewed_pkey PRIMARY KEY USING INDEX idx_grants_viewed_grant_id_agency_id_user_id_unique;  
    `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
    // Rebuild the original index then flip the PK back to it
    await knex.raw(`
        CREATE UNIQUE INDEX CONCURRENTLY idx_grants_viewed_grant_id_agency_id_unique 
            ON grants_viewed (grant_id, agency_id)
    `);
    await knex.raw(`
        ALTER TABLE grants_viewed 
            DROP CONSTRAINT grants_viewed_pkey,
            ADD CONSTRAINT grants_viewed_pkey PRIMARY KEY USING INDEX idx_grants_viewed_grant_id_agency_id_unique;  
    `);
    // In the forward migration, user_id gets automatically marked non-nullable when it's included
    // in the PK so we want to reverse that here
    await knex.schema.table('grants_viewed', (table) => {
        table.setNullable('user_id');
    });
};

exports.config = {
    // We want to be able to run our two atomic SQL statements separately, as opposed to one single
    // migration-level transaction
    transaction: false,
};
