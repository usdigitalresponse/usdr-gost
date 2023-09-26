const knex = require('./connection');
const db = require('./db');

async function main() {
    await knex.transaction(async (trns) => {
        console.log(trns);
        // get all agencies
        const allAgencies = await knex('agencies');

        const agenciesToMigrate = {};

        for (const agency of allAgencies) {
            const criteria = await db.getAgencyCriteriaForAgency(agency.id); // eslint-disable-line no-await-in-loop
            if (criteria.eligibilityCodes.length > 0 || criteria.includeKeywords.length > 0 || criteria.excludeKeywords.length > 0) {
                agenciesToMigrate[agency.id] = { criteria, user_ids: [] };
            }
        }

        // get users for these agencies
        const allUsers = await knex('users');
        for (const user of allUsers) {
            if (agenciesToMigrate[user.agency_id] !== undefined) {
                agenciesToMigrate[user.agency_id].user_ids.push(user.id);
            } else {
                console.log(`No agency criteria to migrate for user ${user.id}`);
            }
        }

        const toInsert = [];
        for (const [agency_id, details] of Object.entries(agenciesToMigrate)) {
            console.log(agency_id, details);
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
