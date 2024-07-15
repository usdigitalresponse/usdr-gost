/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('grants', (table) => {
    table.date('estimated_award_date');
    table.date('estimated_project_start_date');
    table.date('estimated_synopsis_close_date');
    table.date('estimated_synopsis_post_date');
    table.text('estimated_synopsis_close_date_explanation');
    table.text('fiscal_year');
    table.text('grantor_contact_name');
    table.text('grantor_contact_phone_number');
    table.boolean('is_forecasted');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.table('grants', (table) => {
    table.dropColumn('estimated_award_date');
    table.dropColumn('estimated_project_start_date');
    table.dropColumn('estimated_synopsis_close_date');
    table.dropColumn('estimated_synopsis_post_date');
    table.dropColumn('estimated_synopsis_close_date_explanation');
    table.dropColumn('fiscal_year');
    table.dropColumn('grantor_contact_name');
    table.dropColumn('grantor_contact_phone_number');
    table.dropColumn('is_forecasted');
  });
};
