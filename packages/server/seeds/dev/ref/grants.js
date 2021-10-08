const agencies = require('./agencies');

const usdr = agencies.find((a) => a.abbreviation === 'USDR').id;
const nevada = agencies.find((a) => a.abbreviation === 'NV').id;
const asd = agencies.find((a) => a.abbreviation === 'ASD').id;

const grants = [
    {
        status: 'inbox',
        grant_id: '335255',
        grant_number: '21-605',
        agency_code: 'NSF',
        award_ceiling: '6500',
        cost_sharing: 'No',
        title: 'EAR Postdoctoral Fellowships',
        cfda_list: '47.050',
        open_date: '2021-08-11',
        close_date: '2021-11-03',
        notes: 'auto-inserted by script',
        search_terms: '[in title/desc]+',
        reviewer_name: 'none',
        opportunity_category: 'Discretionary',
        description: '<p class="MsoNormal">The Division of Earth Sciences (EAR) awards Postdoctoral Fellowships </p>',
        eligibility_codes: '25',
        opportunity_status: 'posted',
        raw_body: 'raw body',
        created_at: '2021-08-11 11:30:38.89828-07',
        updated_at: '2021-08-11 12:30:39.531-07',
    },
    {
        status: 'inbox',
        grant_id: '333816',
        grant_number: 'HHS-2021-IHS-TPI-0001',
        agency_code: 'HHS-IHS',
        award_ceiling: '500000',
        cost_sharing: 'No',
        title: 'Community Health Aide Program:  Tribal Planning &amp; Implementation',
        cfda_list: '93.382',
        open_date: '2021-08-05',
        close_date: '2021-09-06',
        notes: 'auto-inserted by script',
        search_terms: '[in title/desc]+',
        reviewer_name: 'none',
        opportunity_category: 'Discretionary',
        description: ' <p>Health Aide Program for Covid</p>',
        eligibility_codes: '11 07 25',
        opportunity_status: 'posted',
        raw_body: 'raw body',
        created_at: '2021-08-06 16:03:53.57025-07',
        updated_at: '2021-08-11 12:35:42.562-07',
    },
    {
        status: 'inbox',
        grant_id: '0',
        grant_number: '0',
        agency_code: 'HHS-IHS',
        award_ceiling: '500000',
        cost_sharing: 'No',
        title: '',
        cfda_list: '93.382',
        open_date: '2021-08-05',
        close_date: '2021-09-06',
        notes: 'auto-inserted by script',
        search_terms: '[in title/desc]+',
        reviewer_name: 'none',
        opportunity_category: 'Discretionary',
        description: '',
        eligibility_codes: '',
        opportunity_status: 'posted',
        raw_body: 'raw body',
        created_at: '2021-08-06 16:03:53.57025-07',
        updated_at: '2021-08-11 12:35:42.562-07',
    },
    {
        status: 'inbox',
        grant_id: '333333',
        grant_number: 'HHS-2021-IHS-TPI-0002',
        agency_code: 'HHS-IHS',
        award_ceiling: '500000',
        cost_sharing: 'No',
        title: 'Community Health Aide Program:  County Planning &amp; Implementation',
        cfda_list: '93.382',
        open_date: '2021-08-05',
        close_date: '2021-09-06',
        notes: 'auto-inserted by script',
        search_terms: '[in title/desc]+',
        reviewer_name: 'none',
        opportunity_category: 'Discretionary',
        description: ' <p>Health Aide Program for Covid</p>',
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
    {
        grant_id: grants[0].grant_id,
        agency_id: asd,
    },
    {
        grant_id: grants[0].grant_id,
        agency_id: nevada,
    },
    {
        grant_id: grants[1].grant_id,
        agency_id: nevada,
    },
];

const grantsInterested = [
    {
        grant_id: grants[0].grant_id,
        agency_id: usdr,
        user_id: 1,
    },
    {
        grant_id: grants[0].grant_id,
        agency_id: asd,
        user_id: 2,
    },
    {
        grant_id: grants[0].grant_id,
        agency_id: nevada,
        user_id: 2,
    },
    {
        grant_id: grants[1].grant_id,
        agency_id: nevada,
    },
];

module.exports = {
    grants,
    assignedGrantsAgency,
    grantsInterested,
};
