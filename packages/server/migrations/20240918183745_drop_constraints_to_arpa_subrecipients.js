/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema.alterTable('arpa_subrecipients', (table) => {
        table.dropUnique(['tenant_id', 'uei']);
        table.index(['tenant_id', 'uei'], 'idx_arpa_subrecipients_tenant_id_uei_unique', {
            predicate: knex.whereNotNull('uei'),
        });
        table.dropUnique(['tenant_id', 'tin']);
        table.index(['tenant_id', 'tin'], 'idx_arpa_subrecipients_tenant_id_tin_unique', {
            predicate: knex.whereNotNull('tin'),
        });
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema.alterTable('arpa_subrecipients', (table) => {
        table.dropIndex([], 'idx_arpa_subrecipients_tenant_id_tin_unique');
        table.unique(['tenant_id', 'tin']);
        table.dropIndex([], 'idx_arpa_subrecipients_tenant_id_uei_unique');
        table.unique(['tenant_id', 'uei']);
    });
};
