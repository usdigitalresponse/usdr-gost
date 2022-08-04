const moment = require('moment');
const { TABLES } = require('../../../src/db/constants');

const roles = {
    adminRole: { id: 1, name: 'admin', rules: {} },
    staffRole: { id: 2, name: 'staff', rules: {} },
};

const agencies = {
    accountancy: {
        id: 0,
        abbreviation: 'SBA',
        name: 'State Board of Accountancy',
        parent: null,
    },
    fleetServices: {
        id: 4,
        abbreviation: 'FSD',
        name: 'Administration: Fleet Services Division',
        parent: null,
    },
};

const users = {
    adminUser: {
        email: 'admin.user@test.com',
        name: 'Admin User',
        agency_id: agencies.accountancy.id,
        role_id: roles.adminRole.id,
    },
    staffUser: {
        email: 'staff.user@test.com',
        name: 'Staff User',
        agency_id: agencies.accountancy.id,
        role_id: roles.staffRole.id,
    },
};

const keywords = {
    accountancyCovid: {
        mode: 'autoinsert ALL keywords matches', search_term: 'Covid', notes: '', agency_id: agencies.accountancy.id,
    },
    fleetServicesTransportation: {
        mode: 'autoinsert ALL keywords matches', search_term: 'Transportation', notes: '', agency_id: agencies.fleetServices.id,
    },
};

const interestedCodes = {
    notApplicable: {
        id: 0, name: 'Not applicable to needs/goals', is_rejection: true,
    },
    inadequateCapacity: {
        id: 1, name: 'Inadequate program capacity', is_rejection: true,
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
        close_date: moment().add(1, 'd').format('YYYY-MM-DD'),
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
        created_at: '2021-08-06 16:03:53.57025-07',
        updated_at: '2021-08-11 12:35:42.562-07',
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
        close_date: moment().add(1, 'd').format('YYYY-MM-DD'),
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
};

const assignedAgencyGrants = {
    earFellowshipAccountAssign: {
        grant_id: grants.earFellowship.grant_id,
        agency_id: agencies.accountancy.id,
        assigned_by: users.adminUser.id,
    },
};

module.exports = {
    users,
    agencyEligibilityCodes,
    keywords,
    assignedAgencyGrants,
};

module.exports.seed = async (knex) => {
    const deletions = Object.values(TABLES).map((tableName) => knex(tableName).del());
    await Promise.all(deletions);

    await knex(TABLES.roles).insert(Object.values(roles));
    await knex(TABLES.agencies).insert(Object.values(agencies));
    await knex(TABLES.users).insert(Object.values(users));
    await knex(TABLES.keywords).insert(Object.values(keywords));
    await knex(TABLES.interested_codes).insert(Object.values(interestedCodes));
    await knex(TABLES.eligibility_codes).insert(Object.values(eligibilityCodes));
    await knex(TABLES.agency_eligibility_codes).insert(Object.values(agencyEligibilityCodes));
    await knex(TABLES.grants).insert(Object.values(grants));
    await knex(TABLES.assigned_grants_agency).insert(Object.values(assignedAgencyGrants));
};
