/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.raw(`CREATE INDEX IF NOT EXISTS idx_grants_opportunity_status ON grants USING btree (opportunity_status) WHERE (opportunity_status <> 'archived'::text)`);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.raw('DROP INDEX IF EXISTS idx_grants_opportunity_status');
};
