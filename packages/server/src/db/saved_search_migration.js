const { getKeywords } = require('.');
const knex = require('./connection');

async function main() {
    await knex.transaction(async (trns) => {
        console.log(trns);
        // get agencies with keywords
        const allKeywords = await getKeywords();
        const keywordsByAgency = {};

        for (const keyword of allKeywords) {
            if (keywordsByAgency[keyword.agency_id] === undefined) {
                keywordsByAgency[keyword.agency_id] = {
                    user_ids: [],
                    keywords: [],
                };
            } else {
                keywordsByAgency[keyword.agency_id].keywords.push(keyword);
            }
        }

        // get users for these agencies
        const allUsers = await knex('users');
        for (const user of allUsers) {
            if (keywordsByAgency[user.agency_id] !== undefined) {
                keywordsByAgency[user.agency_id].user_ids.push(user.id);
            }
        }

        const toInsert = [];
        for (const [agency_id, details] of Object.entries(keywordsByAgency)) {
            console.log(agency_id);
            for (const keyword of details.keywords) {
                for (const user_id of details.user_ids) {
                    toInsert.push(
                        {
                            created_by: user_id,
                            // TODO: what does the criteria schema look like?
                            criteria: keyword,
                            name: `Legacy - Saved Search ${keyword.id}`,
                        },
                    );
                }
            }
        }

        await knex('grants_saved_searches')
            .insert(toInsert)
            .returning('*');
    });
}

module.exports = {
};

if (require.main === module) {
    main().then(() => process.exit(0));
}
