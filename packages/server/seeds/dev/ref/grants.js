const agencies = require('./agencies');

const usdr = agencies.find((a) => a.abbreviation === 'USDR').id;

const grants = [
    {
        status: 'inbox',
        grant_id: '0',
        grant_number: 'TEST_GRANT',
        agency_code: 'TEST',
        award_ceiling: '6500',
        cost_sharing: 'No',
        title: 'Test Grant',
        cfda_list: '47.050',
        open_date: '2021-08-11',
        close_date: '2021-11-03',
        notes: 'auto-inserted by script',
        search_terms: '[in title/desc]+',
        reviewer_name: 'none',
        opportunity_category: 'Discretionary',
        description: '<p>This is a test.</p>',
        eligibility_codes: '25',
        opportunity_status: 'posted',
        raw_body: 'raw body',
        created_at: '2021-08-11 11:30:38.89828-07',
        updated_at: '2021-08-11 12:30:39.531-07',
    },
    {
        status: 'inbox',
        grant_id: '1',
        grant_number: 'TEST_GRANT_2',
        agency_code: 'TEST',
        award_ceiling: '500000',
        cost_sharing: 'No',
        title: 'Test Grant 2',
        cfda_list: '93.382',
        open_date: '2021-08-05',
        close_date: '2021-09-06',
        notes: 'auto-inserted by script',
        search_terms: '[in title/desc]+',
        reviewer_name: 'none',
        opportunity_category: 'Discretionary',
        description: ' <p>This is a test.</p>',
        eligibility_codes: '11 07 25',
        opportunity_status: 'posted',
        raw_body: 'raw body',
        created_at: '2021-08-06 16:03:53.57025-07',
        updated_at: '2021-08-11 12:35:42.562-07',
    },
];

const assignedGrantsAgency = [
    {
        grant_id: grants[0].grant_id,
        agency_id: usdr,
    },
];

const grantsInterested = [
    {
        grant_id: grants[0].grant_id,
        agency_id: usdr,
        user_id: 1,
    },
];

module.exports = {
    grants,
    assignedGrantsAgency,
    grantsInterested,
};
