const agencies = require('./agencies');

const usdr = agencies.find((a) => a.abbreviation === 'USDR').id;
const nevada = agencies.find((a) => a.abbreviation === 'NV').id;
const asd = agencies.find((a) => a.abbreviation === 'ASD').id;

const forecastedGrants = [
    {
        status: 'inbox',
        grant_id: '284822',
        grant_number: 'CDC-RFA-PS16-1606',
        agency_code: 'HHS-CDC-NCHHSTP',
        award_ceiling: '325000',
        cost_sharing: 'No',
        title: 'Comprehensive High-Impact HIV Prevention Projects for Young Men of Color Who Have Sex with Men and Young Transgender Persons of Color',
        cfda_list: '47.050',
        open_date: '2055-08-11',
        close_date: null,
        close_date_explanation: 'Sample text for null close_date',
        notes: 'auto-inserted by script',
        search_terms: '[in title/desc]+',
        reviewer_name: 'none',
        opportunity_category: 'Discretionary',
        description: '<p class="MsoNormal">The Centers for Disease Control and Prevention announces the availability of fiscal year 2055 funds for a cooperative agreement program for community-based organizations (CBOs) to develop and implement High-Impact Human Immunodeficiency Virus (HIV) Prevention Programs.</p>',
        eligibility_codes: '12',
        funding_activity_category_codes: 'HL',
        opportunity_status: 'forecasted',
        raw_body_json: {
            opportunity: {
                id: '284822',
                number: 'CDC-RFA-PS16-1606',
                title: 'Comprehensive High-Impact HIV Prevention Projects for Young Men of Color Who Have Sex with Men and Young Transgender Persons of Color',
                description: '<p class="MsoNormal">The Centers for Disease Control and Prevention announces the availability of fiscal year 2055 funds for a cooperative agreement program for community-based organizations (CBOs) to develop and implement High-Impact Human Immunodeficiency Virus (HIV) Prevention Programs.</p>',
                milestones: {
                    post_date: '2055-08-11',
                    close: {
                        date: null,
                    },
                },
                category: { code: 'D', name: 'Discretionary' },
            },
            agency: { code: 'HHS-CDC-NCHHSTP' },
            award: { ceiling: '325000' },
            cost_sharing_or_matching_requirement: false,
            cfda_numbers: ['47.050'],
            eligible_applicants: [
                { code: '12' },
            ],
            funding_activity: {
                categories: [
                    {
                        name: 'Health',
                        code: 'HL',
                    },
                ],
            },
        },
        created_at: '2021-08-11 11:30:38.89828-07',
        updated_at: '2021-08-11 12:30:39.531-07',
    },
    {
        status: 'inbox',
        grant_id: '284810',
        grant_number: 'HHS-2016-IHS-UIHP1-0001',
        agency_code: 'HHS-IHS',
        award_ceiling: '500000',
        cost_sharing: 'No',
        title: 'Office of Urban Indian Health Program - Title V HIV/AIDS',
        cfda_list: '93.193',
        open_date: '2056-08-05',
        close_date: '2076-09-06',
        notes: 'auto-inserted by script',
        search_terms: '[in title/desc]+',
        reviewer_name: 'none',
        opportunity_category: 'Discretionary',
        description: '<p>The Indian Health Service is accepting limited competitive grant applications for the Office of Urban Indian Health Programs Title V HIV/AIDS program. </p>',
        eligibility_codes: '11 07 25',
        funding_activity_category_codes: 'HL',
        opportunity_status: 'forecasted',
        raw_body_json: {
            opportunity: {
                id: '284810',
                number: 'HHS-2016-IHS-UIHP1-0001',
                title: 'Office of Urban Indian Health Program - Title V HIV/AIDS',
                description: '<p>The Indian Health Service is accepting limited competitive grant applications for the Office of Urban Indian Health Programs Title V HIV/AIDS program. </p>',
                milestones: {
                    post_date: '2056-08-05',
                },
                category: { code: 'D', name: 'Discretionary' },
            },
            agency: { code: 'HHS-IHS' },
            award: { ceiling: '500000' },
            cost_sharing_or_matching_requirement: false,
            cfda_numbers: ['93.193'],
            eligible_applicants: [
                { code: '11' }, { code: '07' }, { code: '25' },
            ],
            funding_activity: {
                categories: [
                    {
                        name: 'Health',
                        code: 'HL',
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
        grant_id: '284793',
        grant_number: 'TI-16-005',
        agency_code: 'HHS-SAMHS',
        award_ceiling: '500000',
        cost_sharing: 'No',
        title: 'Cooperative Agreement to Support the Establishment of a Ukraine HIV International Addiction Technology Transfer Center (UHATTC)',
        cfda_list: '93.243',
        open_date: null,
        close_date: null,
        notes: 'auto-inserted by script',
        search_terms: '[in title/desc]+',
        reviewer_name: 'none',
        opportunity_category: 'Discretionary',
        description: '<p>The purpose of this program is to establish an internationally-based ATTC in Ukraine that primarily builds the capacity and increases the skills and abilities of healthcare providers of the national Ukraine HIV/AIDS program/</p>',
        eligibility_codes: '25',
        funding_activity_category_codes: 'HL ISS',
        opportunity_status: 'forecasted',
        raw_body_json: {
            opportunity: {
                id: '284793',
                number: 'TI-16-005',
                title: 'Cooperative Agreement to Support the Establishment of a Ukraine HIV International Addiction Technology Transfer Center (UHATTC)',
                description: '<p>The purpose of this program is to establish an internationally-based ATTC in Ukraine that primarily builds the capacity and increases the skills and abilities of healthcare providers of the national Ukraine HIV/AIDS program/</p>',
                milestones: {
                    post_date: '2021-08-05',
                },
                category: { code: 'D', name: 'Discretionary' },
            },
            agency: { code: 'HHS-SAMHS' },
            award: { ceiling: '250000' },
            cost_sharing_or_matching_requirement: false,
            cfda_numbers: ['93.243'],
            eligible_applicants: [
                { code: '25' },
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
        grant_id: '284769',
        grant_number: 'PA-FPT-002',
        agency_code: 'HHS-OPHS',
        award_ceiling: '4000000',
        cost_sharing: 'No',
        title: 'Anticipated Availability of funds for Title X Family Planning Training Cooperative Agreements',
        cfda_list: '93.260',
        open_date: '2046-08-05',
        close_date: '2046-09-06',
        close_date_explanation: 'Sample text - close_date has valid date',
        notes: 'auto-inserted by script',
        search_terms: '[in title/desc]+',
        reviewer_name: 'none',
        opportunity_category: 'Discretionary',
        description: ' <p>The overarching goal of these training and technical assistance projects is to improve reproductive health outcomes for men, women and adolescents by reducing unplanned pregnancies, improving efforts to plan and space pregnancies through counseling, lower the rates of STDs, and improving birth outcomes. <p>',
        eligibility_codes: '11 07 25',
        funding_activity_category_codes: 'HL',
        opportunity_status: 'forecasted',
        raw_body_json: {
            opportunity: {
                id: '284769',
                number: 'PA-FPT-002',
                title: 'Anticipated Availability of funds for Title X Family Planning Training Cooperative Agreements',
                description: ' <p>The overarching goal of these training and technical assistance projects is to improve reproductive health outcomes for men, women and adolescents by reducing unplanned pregnancies, improving efforts to plan and space pregnancies through counseling, lower the rates of STDs, and improving birth outcomes. <p>',
                milestones: {
                    post_date: '2021-08-05',
                },
                category: { code: 'D', name: 'Discretionary' },
            },
            agency: { code: 'HHS-OPHS' },
            award: { ceiling: '4000000' },
            cost_sharing_or_matching_requirement: false,
            cfda_numbers: ['93.260'],
            eligible_applicants: [
                { code: '00' }, { code: '01' }, { code: '02' },
            ],
            funding_activity: {
                categories: [
                    {
                        name: 'Health',
                        code: 'HL',
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
