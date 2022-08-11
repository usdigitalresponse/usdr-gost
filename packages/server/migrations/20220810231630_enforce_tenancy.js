
exports.up = function(knex) {
  return knex.schema.alterTable('users', function(table) {
    table.dropNullable('tenant_id');
  }).alterTable('agencies', function(table) {
    table.dropNullable('tenant_id');
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('users', function(table) {
    table.setNullable('tenant_id');
  }).alterTable('agencies', function(table) {
    table.setNullable('tenant_id');
  });
};
