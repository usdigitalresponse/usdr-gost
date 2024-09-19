/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
    await knex.schema.table('arpa_subrecipients', (table) => {
        table.text('name');
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
        table.dropIndex([], 'idx_arpa_subrecipients_tenant_id_name_unique');

        table.dropColumn('name');
    });
};
