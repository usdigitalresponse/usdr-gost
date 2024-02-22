/**
 * Adds a new `close_date_explanation` nullable text field, which will be populated in the next migration
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema.table('grants', (table) => {
        table.text('close_date_explanation');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema.table('grants', (table) => {
        table.dropColumn('close_date_explanation');
    });
};
