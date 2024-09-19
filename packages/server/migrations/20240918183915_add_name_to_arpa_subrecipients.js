/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
    await knex.schema.table('arpa_subrecipients', (table) => {
        table.text('name');
        // option 1
        // table.index(
        //     ['tenant_id', 'name'],
        //     'idx_arpa_subrecipients_tenant_id_name_unique',
        //     {
        //         predicate: knex.whereRaw('name is not null and uei is null and tin is null'),
        //     },
        // );
        // option 2
        // table.unique(
        //     ['tenant_id', 'name'],
        //     {
        //         indexName: 'idx_arpa_subrecipients_tenant_id_name_unique',
        //         predicate: knex.whereRaw('name is not null and uei is null and tin is null'),
        //         useConstraint: false,
        //     },
        // );
        // option 3
    });
    await knex.raw(
        'CREATE UNIQUE INDEX idx_arpa_subrecipients_tenant_id_name_unique ON arpa_subrecipients (tenant_id, name) WHERE name is not null and uei is null and tin is null',
    );
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema.table('arpa_subrecipients', (table) => {
        // option 1
        // table.dropIndex([], 'idx_arpa_subrecipients_tenant_id_name_unique');
        // option 2
        // table.dropUnique([], 'idx_arpa_subrecipients_tenant_id_name_unique');
        // option 3
        table.dropIndex([], 'idx_arpa_subrecipients_tenant_id_name_unique');

        table.dropColumn('name');
    });
};
