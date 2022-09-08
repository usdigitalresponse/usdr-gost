/* eslint-disable func-names */

// ARPA tables recreated in GOST that have tenant_id columns.
// Since GOST has a dedicated tenant table, we want to make tenant_id a FK to that.
const TABLES = [
    'reporting_periods',
    'uploads',
    'arpa_subrecipients',
    'application_settings',
    'projects',
    'period_summaries',
];

exports.up = function (knex) {
    return TABLES.reduce(
        (schema, tableName) => schema.alterTable(tableName, (table) => {
            table.foreign('tenant_id').references('id').inTable('tenants');
        }),
        knex.schema,
    );
};

exports.down = function (knex) {
    return TABLES.reduce(
        (schema, tableName) => schema.alterTable(tableName, (table) => {
            table.dropForeign('tenant_id');
        }),
        knex.schema,
    );
};
