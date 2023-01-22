/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
    await knex.schema
        .table('uploads', (table) => {
            table.timestamp('parsed_data_cached_at');
            table.jsonb('parsed_data');
        });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
    await knex.schema
        .table('uploads', (table) => {
            table.dropColumn('parsed_data_cached_at');
            table.dropColumn('parsed_data');
        });
};
