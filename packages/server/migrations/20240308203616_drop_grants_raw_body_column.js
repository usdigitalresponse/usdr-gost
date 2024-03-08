/**
 * The text column `raw_body` was replaced with a jsonb column `raw_body_json` in a previous migration.
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema.table('grants', (table) => {
        table.dropColumn('raw_body');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema.table('grants', (table) => {
        table.text('raw_body');
    });
};
