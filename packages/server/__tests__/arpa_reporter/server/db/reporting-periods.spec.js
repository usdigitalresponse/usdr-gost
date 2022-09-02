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

const { getAllReportingPeriods, getReportingPeriod } = requireSrc(__filename)
const assert = require('assert')
const _ = require('lodash')
const { withTenantId } = require('../helpers/with-tenant-id')

const TENANT_A = 0
const TENANT_B = 1
const NONEXISTENT_TENANT = 100

describe('db/reporting-periods.js', function () {
  describe('getAll', function () {
    it('Returns a list of reporting periods', async function () {
      const result = await withTenantId(TENANT_A, getAllReportingPeriods)
      assert.equal(result.length, 21)
    })

    it('Only returns reporting periods for the specified tenant', async function () {
      const nonexistent = await withTenantId(NONEXISTENT_TENANT, getAllReportingPeriods)
      assert.equal(nonexistent.length, 0)

      const a = await withTenantId(TENANT_A, getAllReportingPeriods)
      const b = await withTenantId(TENANT_B, getAllReportingPeriods)

      assert.equal(a.length, 21)
      assert.equal(b.length, 21)
      const allIds = _.chain([a, b]).flatten().map('id').uniq().value()
      assert.equal(allIds.length, 42)
    })
  })

  describe('get', function () {
    describe('when a specific id is passed', function () {
      it('Returns that reporting period', async function () {
        const result = await withTenantId(TENANT_A, () => getReportingPeriod(2))
        assert.equal(result.id, 2)
      })

      it('Doesn\'t return a reporting period with mismatched tenant', async function () {
        assert.equal((await withTenantId(TENANT_B, () => getReportingPeriod(2))), null)
      })
    })

    describe('when an invalid id is passed', function () {
      it('returns null', async function () {
        await withTenantId(TENANT_A, async () => {
          assert.equal((await getReportingPeriod('')), null)
          assert.equal((await getReportingPeriod(null)), null)
          assert.equal((await getReportingPeriod(12356)), null)
        })
      })
    })

    it('returns the current reporting period', async function () {
      const a = await withTenantId(TENANT_A, getReportingPeriod)
      assert.equal(a.id, 1)
      assert.equal(a.name, 'Quarterly 1')

      const b = await withTenantId(TENANT_B, getReportingPeriod)
      assert.equal(b.id, 22)
      assert.equal(b.name, 'Quarterly 1')
    })
  })

  describe('close', function () {
    it.skip('Closes a reporting period', async () => {
      // skipped because the reporting period close test is in
      // period-summaries.spec.js
      // TODO: this other test seemed to have been deleted?
    })
  })
})

// NOTE: This file was copied from tests/server/db/reporting-periods.spec.js (git @ 98c1aa2586) in the arpa-reporter repo on 2022-09-02T05:09:55.179Z
