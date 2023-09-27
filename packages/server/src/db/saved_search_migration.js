const knex = require('./connection');
const db = require('.');

async function main() {
    await knex.transaction(async (trns) => {
        // get all agencies
        const allAgencies = await trns('agencies');
        const allEligibilityCodesRes = await trns(`eligibility_codes`).orderBy('code');
        const allEligibilityCodes = allEligibilityCodesRes.map((ec) => ec.code).toString();

        const agenciesToMigrate = {};

        for (const agency of allAgencies) {
            const criteria = await db.getAgencyCriteriaForAgency(agency.id); // eslint-disable-line no-await-in-loop
            if (criteria.eligibilityCodes.toString() !== allEligibilityCodes || criteria.includeKeywords.length > 0 || criteria.excludeKeywords.length > 0) {
                agenciesToMigrate[agency.id] = { criteria, user_ids: [] };
                console.log(`Migrating agency criteria for agency ${agency.id}`);
            } else {
                console.log(`No agency criteria to migrate for agency ${agency.id}`);
            }
        }

        // get users for these agencies
        const allUsers = await trns('users');
        for (const user of allUsers) {
            if (agenciesToMigrate[user.agency_id] !== undefined) {
                agenciesToMigrate[user.agency_id].user_ids.push(user.id);
                console.log(`Migrating agency criteria for user ${user.id} belonging to agency ${user.agency_id}`);
            } else {
                console.log(`No agency criteria to migrate for user ${user.id} belonging to agency ${user.agency_id}`);
            }
        }

        const toInsert = [];
        for (const [agency_id, details] of Object.entries(agenciesToMigrate)) {
            console.log(agency_id, details);
            for (const user_id of details.user_ids) {
                toInsert.push(
                    {
                        created_by: user_id,
                        // TODO: what does the criteria schema look like?
                        criteria: details.criteria,
                        name: `Legacy - Saved Search`,
                    },
                );
            }
        }
        console.log(toInsert);
        console.log(toInsert.length);

        /*
        await trns('grants_saved_searches')
            .insert(toInsert)
            .returning('*');
        */
    });
}

module.exports = {
    migrate_keywords_to_saved_search: main,
};

if (require.main === module) {
    main().then(() => process.exit(0));
}
