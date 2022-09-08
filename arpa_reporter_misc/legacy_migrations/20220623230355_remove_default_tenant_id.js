
const _ = require('lodash')
const { TABLES: PREV_MIGRATION_TABLES } = require('./20220519161859_add_tenant_id')

const TABLES_REMOVED_SINCE_PREV_MIGRATION = [
  'subrecipients' // 20220526001139_kill_subrecipients_table
]
const NEW_TABLES_SINCE_PREV_MIGRATION = [
  'arpa_subrecipients' // 202205200000_arpa_subrecipients_table
]
const TABLES = _.chain(PREV_MIGRATION_TABLES)
  .difference(TABLES_REMOVED_SINCE_PREV_MIGRATION)
  .concat(NEW_TABLES_SINCE_PREV_MIGRATION)
  .value()

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  // This reduce in effect chains each of these calls together and returns the resulting promise
  return TABLES.reduce((schema, tableName) => schema.alterTable(tableName, table => {
    // Calling alter() means you need to re-declare all constraints you want. So not having .defaultTo()
    // here removes the default value.
    // This only affects new inserts; existing rows already had the
    // default value written to them during 20220519161859_add_tenant_id migration
    table.integer('tenant_id').notNullable().alter()
  }), knex.schema)
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  // This reduce in effect chains each of these calls together and returns the resulting promise
  return TABLES.reduce((schema, tableName) => schema.alterTable(tableName, table => {
    table.integer('tenant_id').notNullable().defaultTo(0).alter()
  }), knex.schema)
}

// NOTE: This file was copied from migrations/20220623230355_remove_default_tenant_id.js (git @ d124c44d0e) in the arpa-reporter repo on 2022-09-08T23:48:24.330Z
