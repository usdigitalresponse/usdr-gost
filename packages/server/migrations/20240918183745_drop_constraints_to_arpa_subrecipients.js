/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
    await knex.schema.alterTable('arpa_subrecipients', (table) => {
        table.dropUnique(['tenant_id', 'uei']);
        table.dropUnique(['tenant_id', 'tin']);

        // table.index(
        //     ['tenant_id', 'uei'],
        //     'idx_arpa_subrecipients_tenant_id_uei_unique',
        //     {
        //         predicate: knex.whereNotNull('uei'),
        //     },
        // );
        // table.index(
        //     ['tenant_id', 'tin'],
        //     'idx_arpa_subrecipients_tenant_id_tin_unique',
        //     {
        //         predicate: knex.whereNotNull('tin'),
        //     },
        // );
        // table.unique(
        //     ['tenant_id', 'uei'],
        //     {
        //         indexName: 'idx_arpa_subrecipients_tenant_id_uei_unique',
        //         predicate: knex.whereNotNull('uei'),
        //         useConstraint: false,
        //     },
        // );
        // table.unique(
        //     ['tenant_id', 'tin'],
        //     {
        //         indexName: 'idx_arpa_subrecipients_tenant_id_tin_unique',
        //         predicate: knex.whereNotNull('tin'),
        //         useConstraint: false,
        //     },
        // );
    });
    await knex.raw(
        'CREATE UNIQUE INDEX idx_arpa_subrecipients_tenant_id_uei_unique ON arpa_subrecipients (tenant_id, uei) WHERE uei IS NOT NULL',
    );
    await knex.raw(
        'CREATE UNIQUE INDEX idx_arpa_subrecipients_tenant_id_tin_unique ON arpa_subrecipients (tenant_id, tin) WHERE tin IS NOT NULL',
    );
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema.alterTable('arpa_subrecipients', (table) => {
        // option 1
        // table.dropIndex([], 'idx_arpa_subrecipients_tenant_id_tin_unique');
        // table.dropIndex([], 'idx_arpa_subrecipients_tenant_id_uei_unique');
        // option 2
        // table.dropUnique([], 'idx_arpa_subrecipients_tenant_id_tin_unique');
        // table.dropUnique([], 'idx_arpa_subrecipients_tenant_id_uei_unique');
        // option 3
        table.dropIndex([], 'idx_arpa_subrecipients_tenant_id_tin_unique');
        table.dropIndex([], 'idx_arpa_subrecipients_tenant_id_uei_unique');

        table.unique(['tenant_id', 'tin']);
        table.unique(['tenant_id', 'uei']);
    });
};
