/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema.alterTable('agencies', (table) => table.unique(['tenant_id', 'name']).dropUnique(['name']));
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema.alterTable('agencies', (table) => table.unique(['name']).dropUnique(['tenant_id', 'name']));
};
