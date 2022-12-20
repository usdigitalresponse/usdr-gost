/**
 * This migration adds two new columns to the arpa_subrecipient table so that we can more
 * accurately handle subrecipients that have already been reported. Subrecipients that have already
 * been reported to Treasury cannot be updated unless we provide the new unique treasury id in the
 * update row. There are 3 possible states for these new columns:
 * - has_been_reported is false: This has never been reported and should be included in export files
 * - has_been_reported is true, treasury_id is null: We can't update this entity without the id,
 *   so they should be ommitted from any exports.
 * - has_been_reported is true, treasury id is non-null: This entity can be updated and should be
 *   included in exports again, making sure to include the treasury id in that export.
 */
exports.up = async function (knex) {
    await knex.schema
        .table('arpa_subrecipients', (table) => {
            table.string('treasury_id');
            table.boolean('has_been_reported').notNullable().defaultTo(false);
            table.unique(['tenant_id', 'treasury_id']);
        });
};

exports.down = async function (knex) {
    await knex.schema
        .table('arpa_subrecipients', (table) => {
            table.dropUnique(['tenant_id', 'treasury_id']);
            table.dropColumns('treasury_id', 'has_been_reported');
        });
};
