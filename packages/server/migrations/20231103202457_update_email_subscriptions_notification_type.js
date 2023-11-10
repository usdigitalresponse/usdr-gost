/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema.raw(
        `
              -- Drop the existing stale constraint
              ALTER TABLE email_subscriptions DROP CONSTRAINT email_subscriptions_notification_type_check;
              -- Add new updated constraint
              ALTER TABLE email_subscriptions ADD CONSTRAINT email_subscriptions_notification_type_check CHECK (notification_type IN ('GRANT_ASSIGNMENT', 'GRANT_INTEREST', 'GRANT_DIGEST', 'GRANT_FINDER_UPDATES'));
        `,
    );
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema.raw(
        `
              -- Drop the existing stale constraint
              ALTER TABLE email_subscriptions DROP CONSTRAINT email_subscriptions_notification_type_check;
              -- Add new updated constraint
              ALTER TABLE email_subscriptions ADD CONSTRAINT email_subscriptions_notification_type_check CHECK (notification_type IN ('GRANT_ASSIGNMENT', 'GRANT_INTEREST', 'GRANT_DIGEST'));
          `,
    );
};
