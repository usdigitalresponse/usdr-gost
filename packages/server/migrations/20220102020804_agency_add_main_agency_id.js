/* eslint-disable func-names */
exports.up = function (knex) {
    return knex.schema
        .table('agencies', (table) => {
            /**
             * In the API nomenclature, main_agency_id will refer to the organization id(agency.id).
             * For example, state of nevada should have an organization represented as an agency.
             * This agency record is the main_agency_id, child agency of nevada must have
             * main_agency_id pointing to state of nevada agency.id.
             */
            table.integer('main_agency_id').unsigned();

            table.foreign('main_agency_id').references('agencies.id');
        });
};

exports.down = function (knex) {
    return knex.schema
        .table('agencies', (table) => {
            table.dropColumn('main_agency_id');
        });
};
