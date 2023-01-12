const constants = require('../src/lib/email/constants');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema.createTable('email_subscriptions', (table) => {
        table.increments('id', { primaryKey: true }).notNullable();
        table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
        table.timestamp('updated_at', { useTz: true }).nullable();
        table.integer('agency_id').notNullable();
        table.foreign('agency_id').references('id').inTable('agencies');
        table.string('notification_type', [50]).notNullable().checkIn(Object.values(constants.notificationType), 'email_subscriptions_notification_type_check');
        table.string('status', [50]).notNullable().checkIn(Object.values(constants.emailSubscriptionStatus), 'email_subscriptions_status_check');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema.dropTable('email_subscriptions');
};
