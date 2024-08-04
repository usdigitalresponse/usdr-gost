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

module.exports = { followGrant, unfollowGrant };
