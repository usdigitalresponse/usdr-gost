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

// NOTE: This file was copied from tests/server/services/generate-arpa-report.spec.js (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z
