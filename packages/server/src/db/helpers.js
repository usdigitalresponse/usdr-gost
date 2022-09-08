function whereAgencyCriteriaMatch(qb, criteria) {
    if (!criteria) {
        return;
    }
    if (criteria.eligibilityCodes) {
        qb.where('eligibility_codes', '~', criteria.eligibilityCodes.join('|'));
    }

    if (criteria.keywords && criteria.keywords.length > 0) {
        qb.where('description', '~*', criteria.keywords.join('|'));
    }
}

module.exports = {
    whereAgencyCriteriaMatch,
};
