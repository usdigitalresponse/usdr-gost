const agencies = require('./agencies');

const globalKeywords = [
    // Keywords listed here will be pre-seeded for each agency, for example:
    // {
    //     mode: 'autoinsert ALL keywords matches',
    //     search_term: 'Covid',
    //     notes: '',
    //     agency_id: null,
    // },
];

module.exports = [
    {

        mode: 'autoinsert ALL keywords matches', search_term: '', notes: '', agency_id: null,
    },
].concat(...agencies.map((agency) => globalKeywords.map((k) => ({
    ...k,
    agency_id: agency.id,
}))));
