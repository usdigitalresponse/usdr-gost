/* eslint-disable func-names */
exports.up = function (knex) {
    return knex.schema
        .table('tenants', (table) => {
            table.bool('uses_spoc_process').defaultTo(false);
        });
};

exports.down = function (knex) {
    return knex.schema
        .table('tenants', (table) => {
            table.dropColumn('uses_spoc_process');
        });
};
