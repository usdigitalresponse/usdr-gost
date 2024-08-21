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

module.exports = { followGrant, unfollowGrant, getFollowerForGrant };
