const assert = require('assert')

const { generateReport } = require('../../../../src/arpa_reporter/services/generate-arpa-report')
const { withTenantId } = require('../helpers/with-tenant-id')

describe('arpa report generation', function () {
  it('generates a report', async function () {
    const tenantId = 0
    const report = await withTenantId(tenantId, () => generateReport(1))
    assert.ok(report)
  })
})

// NOTE: This file was copied from tests/server/services/generate-arpa-report.spec.js (git @ 26f71a0d6d) in the arpa-reporter repo on 2022-09-12T21:06:59.476Z
