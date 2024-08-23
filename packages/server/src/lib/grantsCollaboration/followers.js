async function followGrant(knex, grantId, userId) {
    return knex.transaction(async (trx) => {
        try {
            await trx('grant_followers').insert({ grant_id: grantId, user_id: userId });
        } catch (err) {
            if (err.code === '23505') { // unique constraint violation
                await trx.rollback();
            } else {
                throw err;
            }
        }
    });
}

async function unfollowGrant(knex, grantId, userId) {
    await knex('grant_followers')
        .where({ grant_id: grantId, user_id: userId })
        .del();
}

async function getFollowerForGrant(knex, grantId, userId) {
    const [grantFollower] = await knex('grant_followers')
        .select(
            'grant_followers.id',
            'grant_followers.grant_id',
            'grant_followers.user_id',
            'grant_followers.created_at',
        )
        .where({ grant_id: grantId, user_id: userId });

    if (!grantFollower) {
        return null;
    }

    return {
        id: grantFollower.id,
        grant: {
            id: grantFollower.grant_id,
        },
        user: {
            id: grantFollower.user_id,
        },
        createdAt: grantFollower.created_at,
    };
}

async function getFollowersForGrant(knex, grantId, organizationId, { beforeFollow, limit = 50 } = {}) {
    const query = knex('grant_followers')
        .select(
            'grant_followers.id',
            'grant_followers.grant_id',
            'grant_followers.user_id',
            'grant_followers.created_at',
            'users.name as user_name',
            'users.email as user_email',
            'tenants.id as organization_id',
            'tenants.display_name as organization_name',
            'agencies.id as team_id',
            'agencies.name as team_name',
        )
        .join('users', 'users.id', 'grant_followers.user_id')
        .join('agencies', 'agencies.id', 'users.agency_id')
        .join('tenants', 'tenants.id', 'users.tenant_id')
        .where('grant_followers.grant_id', grantId)
        .andWhere('tenants.id', organizationId)
        .orderBy('created_at', 'desc')
        .limit(limit);

    if (beforeFollow) {
        query.andWhere('grant_followers.id', '<', beforeFollow);
    }

    const grantFollowers = await query;

    return {
        followers: grantFollowers.map((grantFollower) => ({
            id: grantFollower.id,
            createdAt: grantFollower.created_at,
            grant: {
                id: grantFollower.grant_id,
            },
            user: {
                id: grantFollower.user_id,
                name: grantFollower.user_name,
                email: grantFollower.user_email,
                team: {
                    id: grantFollower.team_id,
                    name: grantFollower.team_name,
                },
                organization: {
                    id: grantFollower.organization_id,
                    name: grantFollower.organizationName,
                },
            },
        })),
        pagination: {
            from: grantFollowers.length > 0 ? grantFollowers[grantFollowers.length - 1].id : beforeFollow,
        },
    };
}

// async function getFollowersForGrant(knex, grantId, organizationId, { beforeFollow, limit = 50 } = {}) {
//     const query = knex('grant_followers')
// async function getFollowerForGrant(knex, grantId, userId) {
//     const [grantFollower] = await knex('grant_followers')
//         .select(
//             'grant_followers.id',
//             'grant_followers.grant_id',
//             'grant_followers.user_id',
//             'grant_followers.created_at',
//             'users.name as user_name',
//             'users.email as user_email',
//             'tenants.id as organization_id',
//             'tenants.display_name as organization_name',
//             'agencies.id as team_id',
//             'agencies.name as team_name',
//         )
//         .join('users', 'users.id', 'grant_followers.user_id')
//         .join('agencies', 'agencies.id', 'users.agency_id')
//         .join('tenants', 'tenants.id', 'users.tenant_id')
//         .where('grant_followers.grant_id', grantId)
//         .andWhere('tenants.id', organizationId)
//         .orderBy('created_at', 'desc')
//         .limit(limit);

//     if (beforeFollow) {
//         query.andWhere('grant_followers.id', '<', beforeFollow);
//     }

//     const grantFollowers = await query;

//     return {
//         followers: grantFollowers.map((grantFollower) => ({
//             id: grantFollower.id,
//             createdAt: grantFollower.created_at,
//             grant: {
//                 id: grantFollower.grant_id,
//             },
//             user: {
//                 id: grantFollower.user_id,
//                 name: grantFollower.user_name,
//                 email: grantFollower.user_email,
//                 team: {
//                     id: grantFollower.team_id,
//                     name: grantFollower.team_name,
//                 },
//                 organization: {
//                     id: grantFollower.organization_id,
//                     name: grantFollower.organizationName,
//                 },
//             },
//         })),
//         pagination: {
//             from: grantFollowers.length > 0 ? grantFollowers[grantFollowers.length - 1].id : beforeFollow,
//         },
//     };
// }

// module.exports = {
//     followGrant, unfollowGrant, getFollowersForGrant,
// };
//         )
//         .where({ grant_id: grantId, user_id: userId });

//     if (!grantFollower) {
//         return null;
//     }

//     return {
//         id: grantFollower.id,
//         grant: {
//             id: grantFollower.grant_id,
//         },
//         user: {
//             id: grantFollower.user_id,
//         },
//         createdAt: grantFollower.created_at,
//     };
// }

module.exports = {
    followGrant, unfollowGrant, getFollowerForGrant, getFollowersForGrant,
};
