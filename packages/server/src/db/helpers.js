function whereAgencyCriteriaMatch(qb, criteria) {
    if (criteria?.eligibilityCodes) {
        qb.where('eligibility_codes', '~', criteria.eligibilityCodes.join('|'));
    }

    if (criteria?.keywords) {
        qb.where('description', '~*', criteria.keywords.join('|'));
    }
}

module.exports = {
    whereAgencyCriteriaMatch,
}