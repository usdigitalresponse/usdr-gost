/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema.alterTable('email_subscriptions', (table) => {
        table.integer('user_id').notNullable();
        table.foreign('user_id').references('id').inTable('users');
        table.unique(['user_id', 'agency_id', 'notification_type'], { indexName: 'email_subscriptions_user_agency_notification_type_idx' });
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema.alterTable('email_subscriptions', (table) => {
        table.dropUnique(['user_id', 'agency_id', 'notification_type'], 'email_subscriptions_user_agency_notification_type_idx');
        table.dropColumn('user_id');
    });
};
