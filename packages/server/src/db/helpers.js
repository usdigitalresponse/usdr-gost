const { exclude } = require('inquirer/lib/objects/separator');
const knex = require('./connection');

function whereAgencyCriteriaMatch(qb, criteria) {
    if (!criteria) {
        return;
    }
    if (criteria.eligibilityCodes) {
        qb.where('eligibility_codes', '~', criteria.eligibilityCodes.join('|'));
    }

    if (criteria.keywords && criteria.keywords.length > 0) {
        const includeKeywords = criteria.keywords.filter((keyword) => keyword.type === 'include');
        const excludeKeywords = criteria.keywords.filter((keyword) => keyword.type === 'exclude');
        if (includeKeywords.length > 0) {
            qb.where('description', '~*', includeKeywords.join('|'));
        }
        if (excludeKeywords.length > 0) {
            qb.where('description', '!~*', excludeKeywords.join('|'));
        }
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
