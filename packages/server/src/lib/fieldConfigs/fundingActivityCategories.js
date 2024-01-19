// Corresponds to "Category" facet on grants.gov.
const fundingActivityCategories = [
    { name: 'Affordable Care Act', code: 'ACA' },
    { name: 'Agriculture', code: 'AG' },
    { name: 'Arts', code: 'AR' },
    { name: 'Business and Commerce', code: 'BC' },
    { name: 'Community Development', code: 'CD' },
    { name: 'Consumer Protection', code: 'CP' },
    { name: 'Disaster Prevention and Relief', code: 'DPR' },
    { name: 'Education', code: 'ED' },
    { name: 'Employment, Labor and Training', code: 'ELT' },
    { name: 'Energy', code: 'EN' },
    { name: 'Environment', code: 'ENV' },
    { name: 'Food and Nutrition', code: 'FN' },
    { name: 'Health', code: 'HL' },
    { name: 'Housing', code: 'HO' },
    { name: 'Humanities', code: 'HU' },
    { name: 'Income Security and Social Services', code: 'ISS' },
    { name: 'Information and Statistics', code: 'IS' },
    { name: 'Infrastructure Investment and Jobs Act', code: 'IIJ' },
    { name: 'Law, Justice and Legal Services', code: 'LJL' },
    { name: 'Natural Resources', code: 'NR' },
    { name: 'Opportunity Zone Benefits', code: 'OZ' },
    { name: 'Other', code: 'O' },
    { name: 'Recovery Act', code: 'RA' },
    { name: 'Regional Development', code: 'RD' },
    {
        name: 'Science and Technology and Other Research and Development',
        code: 'ST',
    },
    { name: 'Transportation', code: 'T' },
];

const fundingActivityCategoriesByCode = fundingActivityCategories.reduce(
    (obj, item) => Object.assign(obj, { [item.code]: item }), {},
);

module.exports = { fundingActivityCategories, fundingActivityCategoriesByCode };
