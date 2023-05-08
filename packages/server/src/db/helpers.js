const knex = require('./connection');

function whereAgencyCriteriaMatch(qb, criteria) {
    if (!criteria) {
        return;
    }
    if (criteria.eligibilityCodes) {
        qb.where('eligibility_codes', '~', criteria.eligibilityCodes.join('|'));
    }

    if (criteria.includeKeywords && criteria.includeKeywords.length > 0) {
        /*
            Ensures that if either description/grant_id/grant_number/title
            matches any of the include keywords we will include the grant.
        */
        qb.where('description', '~*', criteria.includeKeywords.join('|'));
        qb.orWhere('grant_id', '~*', criteria.includeKeywords.join('|'));
        qb.orWhere('grant_number', '~*', criteria.includeKeywords.join('|'));
        qb.orWhere('title', '~*', criteria.includeKeywords.join('|'));
    }

    if (criteria.excludeKeywords && criteria.excludeKeywords.length > 0) {
        /*
            Ensures that if either description/grant_id/grant_number/title
            contains any of the exclude keywords we will exclude the grant.

            TODO: figure out if this is what we actually want the behavior to look like.
        */
        qb.where('description', '!~*', criteria.excludeKeywords.join('|'));
        qb.where('grant_id', '!~*', criteria.includeKeywords.join('|'));
        qb.where('grant_number', '!~*', criteria.includeKeywords.join('|'));
        qb.where('title', '!~*', criteria.includeKeywords.join('|'));
    }
}

async function hasOutstandingMigrations() {
    const [, newMigrations] = await knex.migrate.list();
    return newMigrations.length > 0;
}

module.exports = {
    whereAgencyCriteriaMatch,
    hasOutstandingMigrations,
};
