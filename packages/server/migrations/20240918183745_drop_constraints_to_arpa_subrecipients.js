/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema.alterTable('arpa_subrecipients', (table) => {
        table.dropUnique(['tenant_id', 'uei']);
        table.dropUnique(['tenant_id', 'tin']);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema.alterTable('arpa_subrecipients', (table) => {
        table.unique(['tenant_id', 'uei']);
        table.unique(['tenant_id', 'tin']);
    });
};
