/*
--------------------------------------------------------------------------------
-                     tests/db/reporting-periods.spec.js
--------------------------------------------------------------------------------
  A reporting_periods record in postgres looks like this:

               Column             |           Type           |
  --------------------------------+--------------------------+
   id                             | integer                  |
   name                           | text                     |
   start_date                     | date                     |
   end_date                       | date                     |
   period_of_performance_end_date | date                     |
   certified_at                   | timestamp with time zone |
   certified_by                   | text                     |
   reporting_template             | text                     |
   validation_rule_tags           | text[]                   |
   open_date                      | date                     |
   close_date                     | date                     |
   review_period_start_date       | date                     |
   review_period_end_date         | date                     |

*/

const { getAllReportingPeriods, getReportingPeriod } = requireSrc(__filename);
const assert = require('assert');
const _ = require('lodash');

const TENANT_A = 0;
const TENANT_B = 1;
const NONEXISTENT_TENANT = 100;

describe('db/reporting-periods.js', () => {
    describe('getAll', () => {
        it('Returns a list of reporting periods', async () => {
            const result = await getAllReportingPeriods(TENANT_A);
            assert.equal(result.length, 21);
        });

        it('Only returns reporting periods for the specified tenant', async () => {
            const nonexistent = await getAllReportingPeriods(NONEXISTENT_TENANT);
            assert.equal(nonexistent.length, 0);

            const a = await getAllReportingPeriods(TENANT_A);
            const b = await getAllReportingPeriods(TENANT_B);

            assert.equal(a.length, 21);
            assert.equal(b.length, 21);
            const allIds = _.chain([a, b]).flatten().map('id').uniq()
                .value();
            assert.equal(allIds.length, 42);
        });
    });

    describe('get', () => {
        describe('when a specific id is passed', () => {
            it('Returns that reporting period', async () => {
                const result = await getReportingPeriod(TENANT_A, 2);
                assert.equal(result.id, 2);
            });

            it('Doesn\'t return a reporting period with mismatched tenant', async () => {
                assert.equal((await getReportingPeriod(TENANT_B, 2)), null);
            });
        });

        describe('when an invalid id is passed', () => {
            it('returns null', async () => {
                assert.equal((await getReportingPeriod(TENANT_A, '')), null);
                assert.equal((await getReportingPeriod(TENANT_A, null)), null);
                assert.equal((await getReportingPeriod(TENANT_A, 12356)), null);
            });
        });

        it('returns the current reporting period', async () => {
            const a = await getReportingPeriod(TENANT_A);
            assert.equal(a.id, 1);
            assert.equal(a.name, 'Quarterly 1');

            const b = await getReportingPeriod(TENANT_B);
            assert.equal(b.id, 22);
            assert.equal(b.name, 'Quarterly 1');
        });
    });

    describe('close', () => {
        it.skip('Closes a reporting period', async () => {
            // skipped because the reporting period close test is in
            // period-summaries.spec.js
            // TODO: this other test seemed to have been deleted?
        });
    });
});

// NOTE: This file was copied from tests/server/db/reporting-periods.spec.js (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z
