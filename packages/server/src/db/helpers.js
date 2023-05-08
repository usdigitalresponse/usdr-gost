const knex = require('./connection');

function whereAgencyCriteriaMatch(qb, criteria) {
    if (!criteria) {
        return;
    }
    if (criteria.eligibilityCodes) {
        qb.where('eligibility_codes', '~', criteria.eligibilityCodes.join('|'));
    }
    /*
        Ensures that if either description/grant_id/grant_number/title
        matches any of the include keywords we will include the grant.
    */
    if (criteria.includeKeywords && criteria.includeKeywords.length > 0) {
        qb.where((q) => q
            .where('description', '~*', criteria.includeKeywords.join('|'))
            .orWhere('grant_id', '~*', criteria.includeKeywords.join('|'))
            .orWhere('grant_number', '~*', criteria.includeKeywords.join('|'))
            .orWhere('title', '~*', criteria.includeKeywords.join('|')));
    }

    /*
        Ensures that if either description/grant_id/grant_number/title
        contains any of the exclude keywords we will exclude the grant.

        TODO: figure out if this is what we actually want the behavior to look like.
    */
    if (criteria.excludeKeywords && criteria.excludeKeywords.length > 0) {
        qb.where((q) => q
            .where('description', '!~*', criteria.excludeKeywords.join('|'))
            .andWhere('grant_id', '!~*', criteria.includeKeywords.join('|'))
            .andWhere('grant_number', '!~*', criteria.includeKeywords.join('|'))
            .andWhere('title', '!~*', criteria.includeKeywords.join('|')));
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
