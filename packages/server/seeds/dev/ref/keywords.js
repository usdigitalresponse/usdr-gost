const agencies = require('./agencies');

const globalKeywords = [
    {
        mode: 'autoinsert ALL keywords matches', search_term: 'Covid', notes: '', agency_id: null,
    },
    {
        mode: 'autoinsert ALL keywords matches', search_term: 'coronavirus', notes: '', agency_id: null,
    },
    {
        mode: 'autoinsert ALL keywords matches', search_term: 'Cares Act', notes: '', agency_id: null,
    },
    {
        mode: 'autoinsert ALL keywords matches', search_term: 'COVID-19', notes: '', agency_id: null,
    },
    {
        mode: 'autoinsert ALL keywords matches', search_term: 'SARS-CoV-2', notes: '', agency_id: null,
    },
    {
        mode: 'autoinsert ALL keywords matches', search_term: 'Coronavirus 2', notes: '', agency_id: null,
    },
    {
        mode: 'autoinsert ALL keywords matches', search_term: '(CARES) Act', notes: '', agency_id: null,
    },
];

module.exports = [
    {

        mode: 'autoinsert ALL keywords matches', search_term: '', notes: '', agency_id: null,
    },
].concat(...agencies.map((agency) => globalKeywords.map((k) => ({
    ...k,
    agency_id: agency.id,
}))));
