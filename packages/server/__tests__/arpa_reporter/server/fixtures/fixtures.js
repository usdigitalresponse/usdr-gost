const { agencies, users } = require('../../../db/seeds/fixtures');

const TENANT_ID = 0;

const TABLES = {
    reporting_periods: 'reporting_periods',
    uploads: 'uploads',
};

const reportingPeriods = {
    q1_2021: {
        id: 1,
        name: 'Quarterly 1',
        start_date: '2021-01-01',
        end_date: '2021-03-31',
        certified_at: null,
        certified_by: null,
        tenant_id: TENANT_ID,
        template_filename: '',
    },
    q2_2021: {
        id: 2,
        name: 'Quarterly 2',
        start_date: '2021-04-01',
        end_date: '2021-06-30',
        certified_at: null,
        certified_by: null,
        tenant_id: TENANT_ID,
        template_filename: '',
    },
};

const uploads = {
    upload1: {
        filename: 'test-filename-1.xlsm',
        reporting_period_id: reportingPeriods.q1_2021.id,
        user_id: users.adminUser.id,
        agency_id: agencies.accountancy.id,
        ec_code: '1.1',
        tenant_id: TENANT_ID,
        id: '00000000-0000-0000-0000-000000000000',
        notes: null,
        validated_at: '2022-01-01',
        validated_by: users.adminUser.id,
        invalidated_at: null,
        invalidated_by: null,
    },
    upload2: {
        filename: 'test-filename-2.xlsm',
        reporting_period_id: reportingPeriods.q1_2021.id,
        user_id: users.adminUser.id,
        agency_id: agencies.accountancy.id,
        ec_code: '1.1',
        tenant_id: TENANT_ID,
        id: '00000000-0000-0000-0000-000000000001',
        notes: null,
        validated_at: null,
        validated_by: null,
        invalidated_at: null,
        invalidated_by: null,
    },
    upload3: {
        filename: 'test-filename-3.xlsm',
        reporting_period_id: reportingPeriods.q1_2021.id,
        user_id: users.adminUser.id,
        agency_id: agencies.accountancy.id,
        ec_code: '1.1',
        tenant_id: TENANT_ID + 1,
        id: '00000000-0000-0000-0000-000000000002',
        notes: null,
        validated_at: null,
        validated_by: null,
        invalidated_at: null,
        invalidated_by: null,
    },
    upload4_invalidated: {
        filename: 'test-filename-4.xlsm',
        reporting_period_id: reportingPeriods.q1_2021.id,
        user_id: users.adminUser.id,
        agency_id: agencies.accountancy.id,
        ec_code: '1.1',
        tenant_id: TENANT_ID,
        id: '00000000-0000-0000-0000-000000000003',
        notes: null,
        validated_at: null,
        validated_by: null,
        invalidated_at: '2023-03-02',
        invalidated_by: users.staffUser.id,
    },
    upload5_new_quarter: {
        filename: 'test-filename-5.xlsm',
        reporting_period_id: reportingPeriods.q2_2021.id,
        user_id: users.adminUser.id,
        agency_id: agencies.accountancy.id,
        ec_code: '1.1',
        tenant_id: TENANT_ID,
        id: '00000000-0000-0000-0000-000000000004',
        notes: null,
        validated_at: null,
        validated_by: null,
        invalidated_at: null,
        invalidated_by: null,
    },
};

module.exports = {
    TABLES,
    reportingPeriods,
    uploads,
    TENANT_ID,
    users,
};

module.exports.clean = async (knex) => {
    await knex.raw('TRUNCATE TABLE uploads CASCADE');
};

module.exports.seed = async (knex) => {
    await knex.raw('TRUNCATE TABLE uploads CASCADE');
    await knex('uploads').insert(Object.values(uploads));
};
