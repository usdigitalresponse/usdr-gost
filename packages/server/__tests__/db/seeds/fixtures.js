const { TABLES } = require('../../../src/db/constants');
const interestedCodes = require('../../../seeds/dev/ref/interestedCodes');

const roles = {
    adminRole: { id: 1, name: 'admin', rules: {} },
    staffRole: { id: 2, name: 'staff', rules: {} },
};

const tenants = {
    SBA: {
        id: 0,
        display_name: 'SBA',
    },
    USDR: {
        id: 1,
        display_name: 'USDR',
    },
    FS: {
        id: 2,
        display_name: 'FS',
    },
};

const agencies = {
    accountancy: {
        id: 0,
        abbreviation: 'SBA',
        code: 'SBA',
        name: 'State Board of Accountancy',
        parent: null,
        tenant_id: tenants.SBA.id,
    },
    subAccountancy: {
        id: 1,
        abbreviation: 'Sub SBA',
        code: 'SSBA',
        name: 'State Board of Sub Accountancy',
        parent: 0,
        tenant_id: tenants.SBA.id,
    },
    usdr: {
        id: 2,
        abbreviation: 'USDR',
        code: 'USDR',
        name: 'United States Digital Response',
        parent: null,
        tenant_id: tenants.USDR.id,
    },
    fleetServices: {
        id: 4,
        abbreviation: 'FSD',
        code: 'FSD',
        name: 'Administration: Fleet Services Division',
        parent: null,
        tenant_id: tenants.FS.id,
    },
};

const users = {
    adminUser: {
        email: 'admin.user@test.com',
        name: 'Admin User',
        agency_id: agencies.accountancy.id,
        role_id: roles.adminRole.id,
        id: roles.adminRole.id,
        tenant_id: agencies.accountancy.tenant_id,
    },
    staffUser: {
        email: 'staff.user@test.com',
        name: 'Staff User',
        agency_id: agencies.accountancy.id,
        role_id: roles.staffRole.id,
        id: roles.staffRole.id,
        tenant_id: agencies.accountancy.tenant_id,
    },
    subStaffUser: {
        email: 'sub.staff.user@test.com',
        name: 'Sub Staff User',
        agency_id: agencies.subAccountancy.id,
        role_id: roles.staffRole.id,
        id: 3,
        tenant_id: agencies.subAccountancy.tenant_id,
    },
    usdrUser: {
        email: 'usdr.volunteer@test.com',
        name: 'USDR user',
        agency_id: agencies.usdr.id,
        role_id: roles.staffRole.id,
        id: 4,
        tenant_id: agencies.usdr.tenant_id,
    },
};

const keywords = {
    accountancyCovid: {
        mode: 'autoinsert ALL keywords matches', search_term: 'Covid', notes: '', agency_id: agencies.accountancy.id, type: 'include',
    },
    accountancyClimate: {
        mode: 'autoinsert ALL keywords matches', search_term: 'Climate', notes: '', agency_id: agencies.accountancy.id, type: 'exclude',
    },
    fleetServicesTransportation: {
        mode: 'autoinsert ALL keywords matches', search_term: 'Transportation', notes: '', agency_id: agencies.fleetServices.id, type: 'include',
    },
};

const eligibilityCodes = {
    native: {
        code: '11', enabled: true, label: 'Native American tribal organizations (other than Federally recognized tribal governments)',
    },
    higherEd: {
        code: '20', enabled: true, label: 'Private institutions of higher education',
    },
};

const agencyEligibilityCodes = {
    accountancyNative: {
        agency_id: agencies.accountancy.id, code: eligibilityCodes.native.code, enabled: true,
    },
    fleetServicesHigherEd: {
        agency_id: agencies.fleetServices.id, code: eligibilityCodes.higherEd.code, enabled: false,
    },
};

const grants = {
    earFellowship: {
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
        description: 'The Division of Earth Sciences (EAR) awards Postdoctoral Fellowships',
        eligibility_codes: '25',
        opportunity_status: 'posted',
        raw_body_json: {
            opportunity: {
                id: '335255',
                number: '21-605',
                title: 'EAR Postdoctoral Fellowships',
                description: 'The Division of Earth Sciences (EAR) awards Postdoctoral Fellowships',
                category: { name: 'Discretionary' },
                milestones: { post_date: '2021-08-11', close: { date: '2021-11-03' } },
            },
            agency: { code: 'NSF' },
            cost_sharing_or_matching_requirement: false,
            cfda_numbers: ['47.050'],
            eligible_applicants: [{ code: '25' }],
            funding_activity: { categories: [{ code: 'ISS', name: 'Income Security and Social Services' }] },
            award: { ceiling: '6500' },
            bill: 'Infrastructure Investment and Jobs Act (IIJA)',
            funding_instrument_types: [{ code: 'CA' }, { code: 'G' }, { code: 'PC' }],
        },
        funding_instrument_codes: 'CA G PC',
        bill: 'Infrastructure Investment and Jobs Act (IIJA)',
        funding_activity_category_codes: 'ISS',
        created_at: '2021-08-11 11:30:38.89828-07',
        updated_at: '2021-08-11 12:30:39.531-07',
    },
    healthAide: {
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
        description: ' Health Aide Program for Covid',
        eligibility_codes: '11 07 25',
        opportunity_status: 'posted',
        raw_body_json: {
            opportunity: {
                id: '333816',
                number: 'HHS-2021-IHS-TPI-0001',
                title: 'Community Health Aide Program:  Tribal Planning &amp; Implementation',
                description: ' Health Aide Program for Covid',
                category: { name: 'Discretionary' },
                milestones: { post_date: '2021-08-05', close: { date: '2021-09-06' } },
            },
            agency: { code: 'HHS-IHS' },
            cost_sharing_or_matching_requirement: false,
            cfda_numbers: ['93.382'],
            eligible_applicants: [{ code: '11' }, { code: '07' }, { code: '25' }],
            funding_activity: { categories: [{ code: 'IS', name: 'Information and Statistics' }] },
            award: { ceiling: '500000' },
            bill: '',
            funding_instrument_types: [{ code: 'O' }],
        },
        funding_instrument_codes: 'O',
        bill: '',
        funding_activity_category_codes: 'IS',
        created_at: '2021-08-06 16:03:53.57025-07',
        updated_at: '2021-08-11 12:35:42.562-07',
    },
    redefiningPossible: {
        status: 'inbox',
        grant_id: '341297',
        grant_number: 'HR001122S0040',
        agency_code: 'DOD-DARPA-TTO',
        award_ceiling: '70000',
        cost_sharing: 'No',
        title: 'Redefining Possible',
        cfda_list: '12.910',
        open_date: '2022-06-21',
        close_date: '2023-06-21',
        notes: 'auto-inserted by script',
        search_terms: '[in title/desc]+',
        reviewer_name: 'none',
        opportunity_category: 'Discretionary',
        description: 'The Tactical Technology Office (TTO) of the Defense Advanced Research Projects Agency (DARPA)',
        eligibility_codes: '11',
        opportunity_status: 'posted',
        raw_body_json: {
            opportunity: {
                id: '341297',
                number: 'HR001122S0040',
                title: 'Redefining Possible',
                description: 'The Tactical Technology Office (TTO) of the Defense Advanced Research Projects Agency (DARPA)',
                category: { name: 'Discretionary' },
                milestones: { post_date: '2022-06-21', close: { date: '2023-06-21' } },
            },
            agency: { code: 'DOD-DARPA-TTO' },
            cost_sharing_or_matching_requirement: false,
            cfda_numbers: ['12.910'],
            eligible_applicants: [{ code: '11' }],
            funding_activity: {
                categories: [{ code: 'ISS', name: 'Income Security and Social Services' }, {
                    code: 'ST',
                    name: 'Science and Technology and Other Research and Development',
                }],
            },
            award: { ceiling: '70000' },
            bill: 'Infrastructure Investment and Jobs Act (IIJA)',
            funding_instrument_types: [{ code: 'O' }, { code: 'PC' }],
        },
        funding_instrument_codes: 'O PC',
        bill: 'Infrastructure Investment and Jobs Act (IIJA)',
        funding_activity_category_codes: 'ISS ST',
        created_at: '2021-01-06 11:30:38.89828-07',
        updated_at: '2022-04-23 12:30:39.531-07',
    },
    noDescOrEligibilityCodes: {
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
        description: null,
        eligibility_codes: '',
        opportunity_status: 'posted',
        raw_body_json: {
            opportunity: {
                id: '0',
                number: '0',
                title: '',
                description: '',
                category: { name: 'Discretionary' },
                milestones: { post_date: '2021-08-05', close: { date: '2021-09-06' } },
            },
            agency: { code: 'HHS-IHS' },
            cost_sharing_or_matching_requirement: false,
            cfda_numbers: ['93.382'],
            award: { ceiling: '500000' },
            bill: '',
        },
        funding_instrument_codes: '',
        bill: '',
        created_at: '2021-08-06 16:03:53.57025-07',
        updated_at: '2021-08-11 12:35:42.562-07',
    },
    interestedGrant: {
        status: 'inbox',
        grant_id: '1',
        grant_number: '1',
        agency_code: 'HHS-IHS',
        award_ceiling: '500000',
        cost_sharing: 'No',
        title: 'interestedGrant',
        cfda_list: '93.382',
        open_date: '2021-08-05',
        close_date: '2021-11-04',
        notes: 'auto-inserted by script',
        search_terms: '[in title/desc]+',
        reviewer_name: 'none',
        opportunity_category: 'Discretionary',
        description: '',
        eligibility_codes: '',
        opportunity_status: 'posted',
        raw_body_json: {
            opportunity: {
                id: '1',
                number: '1',
                title: 'interestedGrant',
                description: '',
                category: { name: 'Discretionary' },
                milestones: { post_date: '2021-08-05', close: { date: '2021-11-04' } },
            },
            agency: { code: 'HHS-IHS' },
            cost_sharing_or_matching_requirement: false,
            cfda_numbers: ['93.382'],
            award: { ceiling: '500000' },
            bill: 'Inflation Reduction Act',
            funding_instrument_types: [{ code: 'G' }, { code: 'O' }],
        },
        funding_instrument_codes: 'G O',
        bill: 'Inflation Reduction Act',
        created_at: '2021-08-06 16:03:53.57025-07',
        updated_at: '2021-08-11 12:35:42.562-07',
    },
    resultGrant: {
        status: 'inbox',
        grant_id: '2',
        grant_number: '2',
        agency_code: 'HHS-IHS',
        award_ceiling: '500000',
        cost_sharing: 'No',
        title: 'resultGrant',
        cfda_list: '93.382',
        open_date: '2021-08-05',
        close_date: '2021-11-05',
        notes: 'auto-inserted by script',
        search_terms: '[in title/desc]+',
        reviewer_name: 'none',
        opportunity_category: 'Discretionary',
        description: '',
        eligibility_codes: '',
        opportunity_status: 'posted',
        raw_body_json: {
            opportunity: {
                id: '2',
                number: '2',
                title: 'resultGrant',
                description: '',
                category: { name: 'Discretionary' },
                milestones: { post_date: '2021-08-05', close: { date: '2021-11-05' } },
            },
            agency: { code: 'HHS-IHS' },
            cost_sharing_or_matching_requirement: false,
            cfda_numbers: ['93.382'],
            award: { ceiling: '500000' },
            bill: 'Coronavirus',
            funding_instrument_types: [{ code: 'CA' }, { code: 'PC' }],
        },
        funding_instrument_codes: 'CA PC',
        bill: 'Coronavirus',
        created_at: '2021-08-06 16:03:53.57025-07',
        updated_at: '2021-08-11 12:35:42.562-07',
    },
    zeroCeilGrant: {
        status: 'inbox',
        grant_id: '3',
        grant_number: '3',
        agency_code: 'HHS-IHS',
        award_ceiling: '0',
        cost_sharing: 'No',
        title: 'zeroCeilGrant',
        cfda_list: '93.382',
        open_date: '2021-08-05',
        close_date: '2021-11-05',
        notes: 'auto-inserted by script',
        search_terms: '[in title/desc]+',
        reviewer_name: 'none',
        opportunity_category: 'Discretionary',
        description: '',
        eligibility_codes: '',
        opportunity_status: 'posted',
        raw_body_json: {
            opportunity: {
                id: '3',
                number: '3',
                title: 'zeroCeilGrant',
                description: '',
                category: { name: 'Discretionary' },
                milestones: { post_date: '2021-08-05', close: { date: '2021-11-05' } },
            },
            agency: { code: 'HHS-IHS' },
            cost_sharing_or_matching_requirement: false,
            cfda_numbers: ['93.382'],
            award: { ceiling: '0' },
            bill: 'Coronavirus',
            funding_instrument_types: [{ code: 'PC' }],
        },
        funding_instrument_codes: 'PC',
        bill: 'Coronavirus',
        created_at: '2021-08-06 16:03:53.57025-07',
        updated_at: '2021-08-11 12:35:42.562-07',
    },
    nullCeilGrant: {
        status: 'inbox',
        grant_id: '4',
        grant_number: '4',
        agency_code: 'HHS-IHS',
        award_ceiling: undefined,
        cost_sharing: 'No',
        title: 'nullCeilGrant',
        cfda_list: '93.382',
        open_date: '2021-08-05',
        close_date: '2021-11-05',
        notes: 'auto-inserted by script',
        search_terms: '[in title/desc]+',
        reviewer_name: 'none',
        opportunity_category: 'Discretionary',
        description: '',
        eligibility_codes: '',
        opportunity_status: 'posted',
        raw_body_json: {
            opportunity: {
                id: '4',
                number: '4',
                title: 'nullCeilGrant',
                description: '',
                category: { name: 'Discretionary' },
                milestones: { post_date: '2021-08-05', close: { date: '2021-11-05' } },
            },
            agency: { code: 'HHS-IHS' },
            cost_sharing_or_matching_requirement: false,
            cfda_numbers: ['93.382'],
            bill: 'Coronavirus',
            funding_instrument_types: [{ code: 'PC' }],
        },
        funding_instrument_codes: 'PC',
        bill: 'Coronavirus',
        created_at: '2021-08-06 16:03:53.57025-07',
        updated_at: '2021-08-11 12:35:42.562-07',
    },
};

const forecastedGrants = {
    hasCloseDateExplanation: {
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
    hasCloseAndOpenDates: {
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
    nullOpenAndCloseDates: {
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
    validOpenAndCloseDates: {
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
};

const grantsInterested = {
    entry1: {
        agency_id: agencies.accountancy.id,
        grant_id: grants.healthAide.grant_id,
        user_id: users.adminUser.id,
        created_at: '2021-08-11 11:30:38.89828-07',
        updated_at: '2021-08-11 12:30:39.531-07',
        // Rejected
        interested_code_id: interestedCodes.filter((c) => c.name === 'Not applicable to needs/goals')[0].id,
    },
    entry2: {
        agency_id: agencies.accountancy.id,
        grant_id: grants.earFellowship.grant_id,
        user_id: users.adminUser.id,
        created_at: '2022-08-06 16:03:53.57025-07',
        updated_at: '2021-08-11 12:35:42.562-07',
        // Rejected
        interested_code_id: interestedCodes.filter((c) => c.name === 'Inadequate program capacity')[0].id,
    },
    entry3: {
        agency_id: agencies.fleetServices.id,
        grant_id: grants.redefiningPossible.grant_id,
        user_id: users.adminUser.id,
        created_at: '2022-01-06 11:30:38.89828-07',
        updated_at: '2022-04-23 12:30:39.531-07',
        // Rejected
        interested_code_id: interestedCodes.filter((c) => c.name === 'Inadequate program capacity')[0].id,
    },
    entry4: {
        agency_id: agencies.accountancy.id,
        grant_id: grants.interestedGrant.grant_id,
        user_id: users.adminUser.id,
        created_at: '2022-01-06 11:30:38.89828-07',
        updated_at: '2022-04-23 12:30:39.531-07',
        interested_code_id: interestedCodes.filter((code) => code.status_code === 'Interested')[0].id,
    },
    entry5: {
        agency_id: agencies.accountancy.id,
        grant_id: grants.resultGrant.grant_id,
        user_id: users.adminUser.id,
        created_at: '2022-01-06 11:30:38.89828-07',
        updated_at: '2022-04-23 12:30:39.531-07',
        interested_code_id: interestedCodes.filter((code) => code.status_code === 'Result')[0].id,
    },
    entry6: {
        // Both this agency and its parent agency are interested in same grant
        agency_id: agencies.subAccountancy.id,
        grant_id: grants.interestedGrant.grant_id,
        user_id: users.adminUser.id,
        created_at: '2022-01-06 11:30:38.89828-07',
        updated_at: '2022-04-23 12:30:39.531-07',
        interested_code_id: interestedCodes.filter((code) => code.status_code === 'Interested')[0].id,
    },
};

const assignedAgencyGrants = {
    earFellowshipAccountAssign: {
        grant_id: grants.earFellowship.grant_id,
        agency_id: agencies.accountancy.id,
        assigned_by: users.adminUser.id,
        created_at: '2022-09-13T18:05:21.515-07',
    },
};

const grantsSavedSearches = [
    {
        name: 'Simple 2 result search based on included keywords',
        created_by: users.adminUser.id,
        criteria: JSON.stringify({
            includeKeywords: 'Community Health Aide Program',
        }),
        created_at: '2023-08-10 16:26:25.555863+00',
        updated_at: '2023-08-10 16:26:25.555863+00',
    },
];

const grantsViewed = {
    entry1: {
        agency_id: agencies.accountancy.id,
        grant_id: grants.earFellowship.grant_id,
        user_id: users.adminUser.id,
        created_at: '2022-08-06 16:03:53.57025-07',
        updated_at: '2021-08-11 12:35:42.562-07',
    },
};

module.exports = {
    tenants,
    agencies,
    users,
    agencyEligibilityCodes,
    keywords,
    assignedAgencyGrants,
    grantsSavedSearches,
    grantsInterested,
    grants,
    interestedCodes,
    roles,
    grantsViewed,
};

// Reset Id sequence where seeds supply predefined id
const insertWithReset = async (knex, tableName, records) => {
    await knex(tableName).insert(records);
    await knex.raw(`SELECT setval('${tableName}_id_seq', (SELECT MAX(id) from "${tableName}"));`);
};

module.exports.seed = async (knex) => {
    // https://stackoverflow.com/a/36499676
    // await knex.migrate.rollback();
    const truncateStmt = `TRUNCATE TABLE ${Object.values(TABLES).join(', ')} RESTART IDENTITY CASCADE`;
    await knex.raw(truncateStmt).catch(
        async (err) => {
            console.log(err.stack);
            console.log('migrating the database to the latest');
            await knex.migrate.latest();
        },
    );

    await insertWithReset(knex, TABLES.tenants, Object.values(tenants));
    await insertWithReset(knex, TABLES.roles, Object.values(roles));
    await insertWithReset(knex, TABLES.agencies, Object.values(agencies));
    await knex(TABLES.tenants).update({ main_agency_id: agencies.accountancy.id }).where('id', 1);
    await insertWithReset(knex, TABLES.users, Object.values(users));
    await knex(TABLES.keywords).insert(Object.values(keywords));
    await knex(TABLES.interested_codes).insert(Object.values(interestedCodes));
    await knex(TABLES.eligibility_codes).insert(Object.values(eligibilityCodes));
    await knex(TABLES.agency_eligibility_codes).insert(Object.values(agencyEligibilityCodes));
    await knex(TABLES.grants).insert(Object.values(grants));
    await knex(TABLES.assigned_grants_agency).insert(Object.values(assignedAgencyGrants));
    await knex(TABLES.grants_interested).insert(Object.values(grantsInterested));
    await knex(TABLES.grants_saved_searches).insert(Object.values(grantsSavedSearches));
    await knex(TABLES.grants_viewed).insert(Object.values(grantsViewed));
    await knex(TABLES.grants).insert(Object.values(forecastedGrants));
};
