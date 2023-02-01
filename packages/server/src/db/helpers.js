const knex = require('./connection');

function whereAgencyCriteriaMatch(qb, criteria) {
    if (!criteria) {
        return;
    }
    if (criteria.eligibilityCodes) {
        qb.where('eligibility_codes', '~', criteria.eligibilityCodes.join('|'));
    }

    if (criteria.includeKeywords && criteria.includeKeywords.length > 0) {
        qb.where('description', '~*', criteria.includeKeywords.join('|'));
    }

    if (criteria.excludeKeywords && criteria.excludeKeywords.length > 0) {
        qb.where('description', '!~*', criteria.excludeKeywords.join('|'));
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
