const TABLES = [
  'application_settings',
  'period_summaries',
  'reporting_periods',
  'subrecipients',
  'uploads',
  'projects',

  // NOTE(mbroussard): when copying this migration to GOST repo, comment these out since these tables
  // already exist there with the tenant_id field.
  'users',
  'agencies'
]

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  // This reduce in effect chains each of these calls together and returns the resulting promise
  const schema = TABLES.reduce(
    (schema, tableName) =>
      schema.alterTable(tableName, function (table) {
        // We add a default value for two reasons:
        //  - Existing rows should default to a tenant (postgres >= 11 will add default value
        //    existing rows)
        //  - Allow existing inserts to function as-is until updated (instead of throwing)
        // Once we're sure all inserts have a tenant ID specified explicitly, we can do another
        // migration that drops the default value from future inserts.
        table.integer('tenant_id').notNullable().defaultTo(0)
      }),
    knex.schema
  )

  return schema
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  // This reduce in effect chains each of these calls together and returns the resulting promise
  return TABLES.reduce(
    (schema, tableName) =>
      schema.alterTable(tableName, function (table) {
        table.dropColumn('tenant_id')
      }),
    knex.schema
  )
}

exports.TABLES = TABLES

// NOTE: This file was copied from migrations/20220519161859_add_tenant_id.js (git @ 98c1aa2586) in the arpa-reporter repo on 2022-09-02T05:09:55.179Z
