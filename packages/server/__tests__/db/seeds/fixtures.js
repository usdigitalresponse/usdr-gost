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
    FS: {
        id: 1,
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
        description: '<p class="MsoNormal">The Division of Earth Sciences (EAR) awards Postdoctoral Fellowships </p>',
        eligibility_codes: '25',
        opportunity_status: 'posted',
        raw_body: 'raw body',
        funding_instrument_codes: 'CA G PC',
        bill: 'Infrastructure Investment and Jobs Act (IIJA)',
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
        description: ' <p>Health Aide Program for Covid</p>',
        eligibility_codes: '11 07 25',
        opportunity_status: 'posted',
        raw_body: 'raw body',
        funding_instrument_codes: 'O',
        bill: '',
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
        description: '<p class="MsoNormal">The Tactical Technology Office (TTO) of the Defense Advanced Research Projects Agency (DARPA) </p>',
        eligibility_codes: '11',
        opportunity_status: 'posted',
        raw_body: 'raw body',
        funding_instrument_codes: 'O PC',
        bill: 'Infrastructure Investment and Jobs Act (IIJA)',
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
        description: '',
        eligibility_codes: '',
        opportunity_status: 'posted',
        raw_body: 'raw body',
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
        raw_body: 'raw body',
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
        raw_body: 'raw body',
        funding_instrument_codes: 'CA PC',
        bill: 'Coronavirus',
        created_at: '2021-08-06 16:03:53.57025-07',
        updated_at: '2021-08-11 12:35:42.562-07',
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
            includeKeywords: ['Community Health Aide Program'],
        }),
        created_at: '2023-08-10 16:26:25.555863+00',
        updated_at: '2023-08-10 16:26:25.555863+00',
    },
];

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

    await knex(TABLES.tenants).insert(Object.values(tenants));
    await knex(TABLES.roles).insert(Object.values(roles));
    await knex(TABLES.agencies).insert(Object.values(agencies));
    await knex(TABLES.tenants).update({ main_agency_id: agencies.accountancy.id }).where('id', 0);
    await knex(TABLES.users).insert(Object.values(users));
    await knex(TABLES.keywords).insert(Object.values(keywords));
    await knex(TABLES.interested_codes).insert(Object.values(interestedCodes));
    await knex(TABLES.eligibility_codes).insert(Object.values(eligibilityCodes));
    await knex(TABLES.agency_eligibility_codes).insert(Object.values(agencyEligibilityCodes));
    await knex(TABLES.grants).insert(Object.values(grants));
    await knex(TABLES.assigned_grants_agency).insert(Object.values(assignedAgencyGrants));
    await knex(TABLES.grants_interested).insert(Object.values(grantsInterested));
    await knex(TABLES.grants_saved_searches).insert(Object.values(grantsSavedSearches));
};
