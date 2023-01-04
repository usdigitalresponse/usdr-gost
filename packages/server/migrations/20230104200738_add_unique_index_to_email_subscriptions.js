/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema.alterTable('email_subscriptions', (table) => {
        table.unique(['agency_id', 'notification_type'], { indexName: 'email_subscriptions_agency_id_notification_type_idx' });
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema.alterTable('email_subscriptions', (table) => {
        table.dropUnique(['agency_id', 'notification_type'], 'email_subscriptions_agency_id_notification_type_idx');
    });
};
