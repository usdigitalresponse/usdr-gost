const agencies = require('./agencies');

const usdr = agencies.find((a) => a.abbreviation === 'USDR').id;
const nevada = agencies.find((a) => a.abbreviation === 'NV').id;
const asd = agencies.find((a) => a.abbreviation === 'ASD').id;

const forecastedGrants = [
    {
        status: 'inbox',
        grant_id: '444813',
        grant_number: '21-605',
        agency_code: 'NSF',
        award_ceiling: '6500',
        cost_sharing: 'No',
        title: 'EAR Postdoctoral Fellowships w/ close_date_explanation',
        cfda_list: '47.050',
        open_date: '2025-08-11',
        close_date: null,
        close_date_explanation: 'This is sample text',
        notes: 'auto-inserted by script',
        search_terms: '[in title/desc]+',
        reviewer_name: 'none',
        opportunity_category: 'Discretionary',
        description: '<p class="MsoNormal">The Division of Earth Sciences (EAR) awards Postdoctoral Fellowships </p>',
        eligibility_codes: '25',
        funding_activity_category_codes: 'ST',
        opportunity_status: 'forecasted',
        raw_body_json: {
            opportunity: {
                id: '335255',
                number: '21-605',
                title: 'EAR Postdoctoral Fellowships',
                description: '<p class="MsoNormal">The Division of Earth Sciences (EAR) awards Postdoctoral Fellowships </p>',
                milestones: {
                    post_date: '2021-08-11',
                    close: {
                        date: null,
                    },
                },
                category: { code: 'D', name: 'Discretionary' },
            },
            agency: { code: 'NSF' },
            award: { ceiling: '6500' },
            cost_sharing_or_matching_requirement: false,
            cfda_numbers: ['47.050'],
            eligible_applicants: [
                { code: '25' },
            ],
            funding_activity: {
                categories: [
                    {
                        name: 'Science and Technology and Other Research and Development',
                        code: 'ST',
                    },
                ],
            },
        },
        created_at: '2021-08-11 11:30:38.89828-07',
        updated_at: '2021-08-11 12:30:39.531-07',
    },
    {
        status: 'inbox',
        grant_id: '444816',
        grant_number: 'HHS-2021-IHS-TPI-0001',
        agency_code: 'HHS-IHS',
        award_ceiling: '500000',
        cost_sharing: 'No',
        title: 'Community Health Aide Program:  Tribal Planning & Implementation',
        cfda_list: '93.382',
        open_date: '2026-08-05',
        close_date: '2026-09-06',
        notes: 'auto-inserted by script',
        search_terms: '[in title/desc]+',
        reviewer_name: 'none',
        opportunity_category: 'Discretionary',
        description: ' <p>Health Aide Program for Covid</p>',
        eligibility_codes: '11 07 25',
        funding_activity_category_codes: 'HL ISS',
        opportunity_status: 'forecasted',
        raw_body_json: {
            opportunity: {
                id: '333816',
                number: 'HHS-2021-IHS-TPI-0001',
                title: 'Community Health Aide Program:  Tribal Planning & Implementation',
                description: ' <p>Health Aide Program for Covid</p>',
                milestones: {
                    post_date: '2021-08-05',
                },
                category: { code: 'D', name: 'Discretionary' },
            },
            agency: { code: 'HHS-IHS' },
            award: { ceiling: '500000' },
            cost_sharing_or_matching_requirement: false,
            cfda_numbers: ['93.382'],
            eligible_applicants: [
                { code: '11' }, { code: '07' }, { code: '25' },
            ],
            funding_activity: {
                categories: [
                    {
                        name: 'Health',
                        code: 'HL',
                    },
                    {
                        name: 'Income Security and Social Services',
                        code: 'ISS',
                    },
                ],
            },
            revision: { id: 'c3' },
        },
        created_at: '2021-08-06 16:03:53.57025-07',
        updated_at: '2021-08-11 12:35:42.562-07',
        revision_id: 'c3',
    },
    {
        status: 'inbox',
        grant_id: '444824',
        grant_number: 'HHS-2021-IHS-TPI-0001',
        agency_code: 'HHS-IHS',
        award_ceiling: '500000',
        cost_sharing: 'No',
        title: 'Sample forecasted grant with open and close dates = null  ',
        cfda_list: '93.382',
        open_date: null,
        close_date: null,
        notes: 'auto-inserted by script',
        search_terms: '[in title/desc]+',
        reviewer_name: 'none',
        opportunity_category: 'Discretionary',
        description: ' <p>Health Aide Program for Covid</p>',
        eligibility_codes: '11 07 25',
        funding_activity_category_codes: 'HL ISS',
        opportunity_status: 'forecasted',
        raw_body_json: {
            opportunity: {
                id: '333816',
                number: 'HHS-2021-IHS-TPI-0001',
                title: 'Community Health Aide Program:  Tribal Planning & Implementation',
                description: ' <p>Health Aide Program for Covid</p>',
                milestones: {
                    post_date: '2021-08-05',
                },
                category: { code: 'D', name: 'Discretionary' },
            },
            agency: { code: 'HHS-IHS' },
            award: { ceiling: '500000' },
            cost_sharing_or_matching_requirement: false,
            cfda_numbers: ['93.382'],
            eligible_applicants: [
                { code: '11' }, { code: '07' }, { code: '25' },
            ],
            funding_activity: {
                categories: [
                    {
                        name: 'Health',
                        code: 'HL',
                    },
                    {
                        name: 'Income Security and Social Services',
                        code: 'ISS',
                    },
                ],
            },
            revision: { id: 'c3' },
        },
        created_at: '2021-08-06 16:03:53.57025-07',
        updated_at: '2021-08-11 12:35:42.562-07',
        revision_id: 'c3',
    },
    {
        status: 'inbox',
        grant_id: '444836',
        grant_number: 'HHS-2021-IHS-TPI-0001',
        agency_code: 'HHS-IHS',
        award_ceiling: '500000',
        cost_sharing: 'No',
        title: 'Community Health Aide Program: close_date and closed_date_explanation',
        cfda_list: '93.382',
        open_date: '2026-08-05',
        close_date: '2026-09-06',
        close_date_explanation: 'This is sample text',
        notes: 'auto-inserted by script',
        search_terms: '[in title/desc]+',
        reviewer_name: 'none',
        opportunity_category: 'Discretionary',
        description: ' <p>Health Aide Program for Covid</p>',
        eligibility_codes: '11 07 25',
        funding_activity_category_codes: 'HL ISS',
        opportunity_status: 'forecasted',
        raw_body_json: {
            opportunity: {
                id: '333816',
                number: 'HHS-2021-IHS-TPI-0001',
                title: 'Community Health Aide Program:  Tribal Planning & Implementation',
                description: ' <p>Health Aide Program for Covid</p>',
                milestones: {
                    post_date: '2021-08-05',
                },
                category: { code: 'D', name: 'Discretionary' },
            },
            agency: { code: 'HHS-IHS' },
            award: { ceiling: '500000' },
            cost_sharing_or_matching_requirement: false,
            cfda_numbers: ['93.382'],
            eligible_applicants: [
                { code: '11' }, { code: '07' }, { code: '25' },
            ],
            funding_activity: {
                categories: [
                    {
                        name: 'Health',
                        code: 'HL',
                    },
                    {
                        name: 'Income Security and Social Services',
                        code: 'ISS',
                    },
                ],
            },
            revision: { id: 'c3' },
        },
        created_at: '2021-08-06 16:03:53.57025-07',
        updated_at: '2021-08-11 12:35:42.562-07',
        revision_id: 'c3',
    },
];

const assignedForecastedGrantsAgency = [
    {
        grant_id: forecastedGrants[0].grant_id,
        agency_id: usdr,
        assigned_by: 1,
    },
    {
        grant_id: forecastedGrants[0].grant_id,
        agency_id: asd,
        assigned_by: 13,
    },
    {
        grant_id: forecastedGrants[0].grant_id,
        agency_id: nevada,
        assigned_by: 7,
    },
    {
        grant_id: forecastedGrants[1].grant_id,
        agency_id: nevada,
        assigned_by: 6,
    },
];

module.exports = {
    forecastedGrants,
    assignedForecastedGrantsAgency,
};
