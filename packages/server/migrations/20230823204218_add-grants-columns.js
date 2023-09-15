/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema.alterTable('grants', (table) => {
        table.text('funding_instrument_codes');
        table.text('bill');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema.table('grants', (table) => {
        table.dropColumn('funding_instrument_codes');
        table.dropColumn('bill');
    });
};
