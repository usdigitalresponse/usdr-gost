const knex = require('./connection');
const db = require('.');

function log(msg) {
    console.log(msg);
}

async function main() {
    const isDryRun = process.argv.includes('--dry-run');
    const dryRunStr = isDryRun ? 'DRY RUN :: ' : '';

    module.exports.log(`${dryRunStr}Begin migrating legacy agency criteria to saved searches`);

    await knex.transaction(async (trns) => {
        const allAgencies = await trns('agencies');
        const allEligibilityCodesRes = await trns(`eligibility_codes`).orderBy('code');
        const allEligibilityCodesStr = allEligibilityCodesRes.map((ec) => ec.code).toString();
        const allEligibilityCodesByCode = {};
        allEligibilityCodesRes.forEach((ec) => { allEligibilityCodesByCode[ec.code] = ec; });

        /*
            Example criteria:
            {
                "includeKeywords":"foo, bar",
                "excludeKeywords":"baz, ball",
                "opportunityNumber":null,
                "opportunityStatuses":["posted"],
                "fundingTypes":null,
                "agency":null,
                "bill":null,
                "costSharing":null,
                "opportunityCategories":[],
                "postedWithin":[],
                "eligibility":[
                    {"code":"01","enabled":false,"label":"County governments","agency_id":0},
                    {"code":"05","enabled":false,"label":"Independent school districts","agency_id":0},
                    {"code":"06","enabled":true,"label":"Public and State controlled institutions of higher education","agency_id":0},
                    {"code":"02","enabled":false,"label":"City or township governments","agency_id":0}
                ]
            }
        */
        const defaultCriteria = {
            opportunityStatuses: ['posted'],
            fundingTypes: null,
            agency: null,
            bill: null,
            costSharing: null,
            opportunityCategories: [],
            postedWithin: [],
        };

        const agenciesToMigrate = {};

        // Populate agenciesToMigrate with agencies that have legacy criteria
        //      agencies with non-default eligibility codes selections
        //      or agencies with include/exclude keywords
        for (const agency of allAgencies) {
            const legacyCriteria = await db.getAgencyCriteriaForAgency(agency.id); // eslint-disable-line no-await-in-loop
            if (legacyCriteria.eligibilityCodes.toString() !== allEligibilityCodesStr || legacyCriteria.includeKeywords.length > 0 || legacyCriteria.excludeKeywords.length > 0) {
                const newCriteria = {
                    ...defaultCriteria,
                    includeKeywords: legacyCriteria.includeKeywords.join(', '),
                    excludeKeywords: legacyCriteria.excludeKeywords.join(', '),
                    eligibility: legacyCriteria.eligibilityCodes.map((ec) => allEligibilityCodesByCode[ec]),
                };
                const filters = db.formatSearchCriteriaToQueryFilters(JSON.stringify(newCriteria));
                const validationErrors = db.validateSearchFilters(filters);
                if (validationErrors.length > 0) {
                    module.exports.log(`${dryRunStr}Validation errors for agency ${agency.id}: ${validationErrors}. Not migrating.`);
                } else {
                    agenciesToMigrate[agency.id] = {
                        criteria: newCriteria,
                        user_ids: [],
                    };
                    module.exports.log(`${dryRunStr}Migrating agency criteria for agency ${agency.id}`);
                }
            } else {
                module.exports.log(`${dryRunStr}No agency criteria to migrate for agency ${agency.id}`);
            }
        }

        // If agency belongs in the migration list, then populate its user_ids
        const usersByAgencyId = await trns('users').select(knex.raw(`users.agency_id, array_agg(users.id) as user_ids`)).groupBy('users.agency_id');
        for (const { agency_id, user_ids } of usersByAgencyId) {
            if (agenciesToMigrate[agency_id] !== undefined) {
                agenciesToMigrate[agency_id].user_ids = user_ids;
                module.exports.log(`${dryRunStr}Migrating agency criteria for users ${user_ids} belonging to agency ${agency_id}`);
            } else {
                module.exports.log(`${dryRunStr}No agency criteria to migrate for users ${user_ids} belonging to agency ${agency_id}`);
            }
        }

        // Build insert query for saved searches
        const toInsert = [];
        for (const [agency_id, details] of Object.entries(agenciesToMigrate)) {
            if (details.user_ids.length === 0) {
                module.exports.log(`${dryRunStr}No users to migrate for agency ${agency_id}`);
                continue; // eslint-disable-line no-continue
            }

            for (const user_id of details.user_ids) {
                toInsert.push(
                    {
                        created_by: user_id,
                        criteria: details.criteria,
                        name: `Legacy - Saved Search`,
                    },
                );
            }
        }

        // Perform insert if not dry run
        if (!isDryRun) {
            const res = await trns('grants_saved_searches')
                .insert(toInsert)
                .onConflict(knex.raw('ON CONSTRAINT grants_saved_searches_name_created_by_idx'))
                .ignore()
                .returning('id');
            module.exports.log(`${dryRunStr}Inserted ${res.length} saved searches`);
        } else {
            module.exports.log(`${dryRunStr}Would have inserted approximately ${toInsert.length} saved searches. Note: there may be duplicates.`);
        }

        module.exports.log(`${dryRunStr}Done migrating legacy agency criteria to saved searches`);
    });
}

module.exports = {
    migrate_keywords_to_saved_search: main,
    log,
};

if (require.main === module) {
    main().then(() => process.exit(0));
}
