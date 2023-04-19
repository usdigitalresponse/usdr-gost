/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema
        .table('agencies', (table) => {
            table.dropColumn('main_agency_id');
        });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema
        .table('agencies', (table) => {
            table.integer('main_agency_id').unsigned();
            table.foreign('main_agency_id').references('agencies.id');
            table.setNullable('main_agency_id');
        });
};
