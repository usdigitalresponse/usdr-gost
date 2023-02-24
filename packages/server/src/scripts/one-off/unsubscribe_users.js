/* eslint-disable */

const knex = require('./src/db/connection');
const db = require('./src/db');
const emailConstants = require('./src/lib/email/constants');

async function unsubscribeUsers(users) {
    const emailUnsubscribePreference = Object.assign(
        ...Object.values(emailConstants.notificationType).map(
            (k) => ({ [k]: emailConstants.emailSubscriptionStatus.unsubscribed }),
        ),
    );

    for (const user of users) {
        console.log(`Unsubscribing user for emails ${user.id} ${user.email} ${user.agency_id}`);
        await db.setUserEmailSubscriptionPreference(user.id, user.agency_id, emailUnsubscribePreference);
    }
}

async function beginUnsubscription(tenantName, emailsToIgnore=[]) {
    const tenant = await knex('tenants')
        .select('id')
        .where('display_name', '=', tenantName);

    const agencies = await knex('agencies')
        .select('id', 'name')
        .where('tenant_id', '=', tenant[0].id);

    const usersToUnsubscribe = [];

    for (const agency of agencies) {
        const users = await db.getUsersByAgency(agency.id);

        for (const user of users) {
            if (emailsToIgnore.includes(user.email)) {
                continue;
            } else {
                usersToUnsubscribe.push(user);
            }
        }
    };
    await unsubscribeUsers(usersToUnsubscribe);
}

module.exports = { beginUnsubscription, unsubscribeUsers };
