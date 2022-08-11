
exports.up = function(knex) {
    return knex.schema.alterTable('users', function(table) {
        table.dropNullable('tenant_id');
    }).alterTable('agencies', function(table) {
        table.dropNullable('tenant_id');
        table.dropNullable('main_agency_id');
    }).alterTable('tenants', function(table) {
        table.dropNullable('main_agency_id');
    });
};

exports.down = function(knex) {
    return knex.schema.alterTable('users', function(table) {
        table.setNullable('tenant_id');
    }).alterTable('agencies', function(table) {
        table.setNullable('tenant_id');
        table.setNullable('main_agency_id');
    }).alterTable('tenants', function(table) {
        table.setNullable('main_agency_id');
    });
};
