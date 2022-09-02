const setupAgencies = knex => {
  return knex('agencies').insert([
    { name: 'Generic Government', code: 'GOV', tenant_id: 0 },
    { name: 'Office of Management and Budget', code: 'OMB', tenant_id: 0 },
    { name: 'Department of Health', code: 'DOH', tenant_id: 0 },
    { name: 'Executive Office of Health and Human Services', code: 'EOHHS', tenant_id: 0 }
  ]).then(() => {
    return 'Agency data added OK'
  })
}

module.exports = {
  setupAgencies
}

// Run this file directly through node to set up dummy data for manual testing.
if (require.main === module) {
  require('dotenv').config()
  const knex = require('../../../../src/db/connection')
  setupAgencies(knex).then(() => {
    knex.destroy()
  })
}

// NOTE: This file was copied from tests/server/fixtures/add-dummy-data.js (git @ 98c1aa2586) in the arpa-reporter repo on 2022-09-02T05:09:55.179Z
