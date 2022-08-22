/* eslint-disable func-names */

// "code" is a column in ARPA's agencies table that is used to match against fields in uploaded spreadsheets
// GOST has a similar "abbreviation" field on agencies, but its semantics and format requirements differ slightly,
// so we will store both. For existing agencies in GOST, we'll backfill code to be equal to abbreviation

exports.up = async function (knex) {
    // First add the column & uniqueness constraints
    await knex.schema
        .table('agencies', (table) => {
            table.text('code');
            table.unique(['tenant_id', 'code']);
        });

    // Backfill values from GOST's abbreviation column for any existing agencies
    await knex('agencies')
        .whereNull('code')
        .whereNotNull('abbreviation')
        .update({ code: knex.ref('abbreviation') });

    // If any existing agencies didn't have an abbreviation, we still need to set a code since we're
    // making it non-nullable. This will set a value like "CHANGEME_1" whose uniqueness is guaranteed by
    // using the agency ID in the string.
    await knex('agencies')
        .whereNull('code')
        .update({ code: knex.raw('\'CHANGEME_\' || id') });

    // Add NOT NULL constraint
    // NOTE(mbroussard): ARPA doesn't have this, but from reading application code it looks like this
    // field is intended to never be null.
    await knex.schema.table('agencies', (table) => {
        table.dropNullable('code');
    });
};

exports.down = function (knex) {
    return knex.schema
        .table('agencies', (table) => {
            table.dropUnique(['tenant_id', 'code']);
            table.dropColumn('code');
        });
};
