/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema.alterTable('grants', (table) => {
        table.date('award_date');
        table.date('forecast_creation_date');
        table.date('estimated_open_date');
        table.date('fiscal_year');
        table.text('grantor_contact_name');
        table.text('grantor_contact_phone_number');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema.table('grants', (table) => {
        table.dropColumn('award_date');
        table.dropColumn('forecast_creation_date');
        table.dropColumn('estimated_open_date');
        table.dropColumn('fiscal_year');
        table.dropColumn('grantor_contact_name');
        table.dropColumn('grantor_contact_phone_number');
    });
};
