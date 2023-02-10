const assert = require('assert');
const { requireSrc } = require('../utils');

const settings = requireSrc(__filename);
const { withTenantId } = require('../helpers/with-tenant-id');

const TENANT_A = 0;
const TENANT_B = 1;

describe('application settings db', () => {
    describe('applicationSettings', () => {
        it('Returns the current reporting period & title', async () => {
            const a = await withTenantId(TENANT_A, settings.applicationSettings);
            assert.equal(a.current_reporting_period_id, 1);
            assert.equal(a.title, 'Rhode Island');

            const b = await withTenantId(TENANT_B, settings.applicationSettings);
            assert.equal(b.current_reporting_period_id, 22);
            assert.equal(b.title, 'California');
        });
    });

    describe('setCurrentReportingPeriod', () => {
        let savedReportingPeriod;

        beforeEach('save current period', async () => {
            const curr = await withTenantId(TENANT_A, settings.applicationSettings);
            savedReportingPeriod = curr.current_reporting_period_id;
        });

        afterEach('restore reporting period', async () => {
            await withTenantId(TENANT_A, () => settings.setCurrentReportingPeriod(savedReportingPeriod));
        });

        it('Changes the current reporting period', async () => {
            await withTenantId(TENANT_A, async () => {
                await settings.setCurrentReportingPeriod(2);

                const result = await settings.applicationSettings();
                assert.equal(result.current_reporting_period_id, 2);
            });
        });

        it('Only changes the current reporting period for the specified tenant', async () => {
            await withTenantId(TENANT_A, () => settings.setCurrentReportingPeriod(2));

            const a = await withTenantId(TENANT_A, settings.applicationSettings);
            assert.equal(a.current_reporting_period_id, 2);

            const b = await withTenantId(TENANT_B, settings.applicationSettings);
            assert.equal(b.current_reporting_period_id, 22);
        });
    });
});

// NOTE: This file was copied from tests/server/db/settings.spec.js (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z
