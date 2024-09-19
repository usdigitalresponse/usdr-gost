/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema.table('arpa_subrecipients', (table) => {
        table.text('name');
        table.unique(['tenant_id', 'name'], {
            indexName: 'idx_arpa_subrecipients_tenant_id_name_unique',
            predicate: knex.whereRaw('name is not null and uei is null and tin is null'),
        });
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema.table('arpa_subrecipients', (table) => {
        table.dropUnique([], 'idx_arpa_subrecipients_tenant_id_name_unique');
        table.dropColumn('name');
    });
};
