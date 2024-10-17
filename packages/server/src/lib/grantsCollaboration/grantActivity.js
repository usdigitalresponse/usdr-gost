const _ = require('lodash');
const { TABLES } = require('../../db/constants');
const emailConstants = require('../email/constants');

const getActivitiesQuery = (knex) => {
    const noteRevisionsSub = knex
        .select()
        .from({ r: TABLES.grant_notes_revisions })
        .whereRaw('r.grant_note_id = gn.id')
        .orderBy('r.created_at', 'desc')
        .limit(1);

    return knex.unionAll([
        knex
            .select([
                'gf.id',
                'gf.grant_id',
                'gf.user_id',
                'gf.created_at AS activity_at',
                knex.raw(`'follow' AS activity_type`),
                knex.raw('null AS text_content'),
            ])
            .from({ gf: 'grant_followers' }),
        knex
            .select([
                'rev.id',
                'gn.grant_id',
                'gn.user_id',
                'rev.created_at AS activity_at',
                knex.raw(`'note' AS activity_type`),
                'rev.text AS text_content',
            ])
            .from({ gn: 'grant_notes' })
            .joinRaw(`LEFT JOIN LATERAL (${noteRevisionsSub.toString()}) AS rev ON rev.grant_note_id = gn.id`),
    ])
        .as('activity');
};

async function getGrantActivityEmailRecipients(knex, periodStart, periodEnd) {
    const query = knex
        .select([
            'recipient_users.id AS recipient_user_id',
            'recipient_users.name AS recipient_user_name',
            'recipient_users.email AS recipient_user_email',
        ])
        .from(
            getActivitiesQuery(knex),
        )
        .join({ recipient_followers: TABLES.grant_followers }, 'recipient_followers.grant_id', 'activity.grant_id')
        .join({ activity_users: TABLES.users }, 'activity_users.id', 'activity.user_id')
        .join({ recipient_users: TABLES.users }, 'recipient_users.id', 'recipient_followers.user_id')
        .leftJoin({ recipient_subscriptions: TABLES.email_subscriptions }, (builder) => {
            builder
                .on(`recipient_followers.user_id`, '=', `recipient_subscriptions.user_id`)
                .on(`recipient_subscriptions.notification_type`, '=', knex.raw('?', [emailConstants.notificationType.grantActivity]));
        })
        .where('activity.activity_at', '>=', periodStart)
        .andWhere('activity.activity_at', '<=', periodEnd)
        .andWhere('recipient_subscriptions.status', emailConstants.emailSubscriptionStatus.subscribed)
        // only consider actions taken by users in the same organization as the recipient:
        .andWhereRaw('recipient_users.tenant_id = activity_users.tenant_id')
        // exclude rows where the recipient user is the one taking the action,
        // to ensure that users only receive a digest if OTHER users took action:
        .andWhereRaw('recipient_followers.user_id != activity.user_id')
        .groupBy([
            'recipient_user_id',
            'recipient_user_name',
            'recipient_user_email',
        ]);

    const results = await query;

    return results.map((recipient) => ({
        userId: recipient.recipient_user_id,
        userEmail: recipient.recipient_user_email,
        userName: recipient.recipient_user_name,
    }));
}

async function getGrantActivityByUserId(knex, userId, periodStart, periodEnd) {
    const query = knex.select([
        'g.grant_id AS grant_id',
        'g.title AS grant_title',
        'recipient_users.name AS recipient_user_name',
        'recipient_users.email AS recipient_user_email',
        'activity_users.id AS user_id',
        'activity_users.name AS user_name',
        'activity_users.email AS user_email',
        'activity_users_agencies.name AS agency_name',
        'activity.activity_at',
        'activity.activity_type',
        'activity.text_content AS note_text',
    ])
        .from(
            getActivitiesQuery(knex),
        )
        .join({ recipient_followers: TABLES.grant_followers }, 'recipient_followers.grant_id', 'activity.grant_id')
        // incorporate users table for users responsible for the activity:
        .join({ activity_users: TABLES.users }, 'activity_users.id', 'activity.user_id')
        // incorporate users table for the recipient follower:
        .join({ recipient_users: TABLES.users }, 'recipient_users.id', 'recipient_followers.user_id')
        // Additional JOINs for data selected for use in the email's content:
        .join({ g: TABLES.grants }, 'g.grant_id', 'activity.grant_id')
        .join({ activity_users_agencies: TABLES.agencies }, 'activity_users_agencies.id', 'activity_users.agency_id')
        .where('activity.activity_at', '>', periodStart)
        .andWhere('activity.activity_at', '<', periodEnd)
        // Limit to activity where the user performing the activity belongs to the same organization:
        .andWhereRaw('activity_users.tenant_id = recipient_users.tenant_id')
        // limit activity to grants for which the recipient user is a follower
        .andWhere('recipient_followers.user_id', userId)
        .andWhereNot('activity_users.id', userId)
        .orderBy([
            { column: 'g.grant_id', order: 'desc' },
            { column: 'activity.activity_at', order: 'asc' },
        ]);

    const results = await query;

    // Group by grant
    const resultsByGrant = _.groupBy(results, 'grant_id');

    // Grant IDs distinct
    const grantIds = [...new Set(_.map(results, 'grant_id'))];

    return grantIds.map((grantId) => {
        const activities = resultsByGrant[grantId].map((act) => ({
            userId: act.user_id,
            userName: act.user_name,
            userEmail: act.user_email,
            agencyName: act.agency_name,
            activityAt: act.activity_at,
            activityType: act.activity_type,
            noteText: act.note_text,
        }));
        const activitiesByType = _.groupBy(activities, 'activityType');

        return {
            grantId,
            grantTitle: resultsByGrant[grantId][0].grant_title,
            notes: activitiesByType.note || [],
            follows: activitiesByType.follow || [],
        };
    });
}

module.exports = {
    getGrantActivityByUserId,
    getGrantActivityEmailRecipients,
};
