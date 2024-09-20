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
    await knex.raw(
        'ALTER TABLE arpa_subrecipients ADD CONSTRAINT chk_at_least_one_of_uei_tin_name_not_null CHECK (num_nonnulls(uei, tin, name) > 0)',
    );
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
    await knex.schema.table('arpa_subrecipients', (table) => {
        table.dropIndex([], 'idx_arpa_subrecipients_tenant_id_name_unique');

        table.dropColumn('name');
    });

    await knex.raw(
        'ALTER TABLE arpa_subrecipients DROP CONSTRAINT chk_at_least_one_of_uei_tin_name_not_null',
    );
};
