
const { isRunningInGOST } = require('../helpers/is_gost')

// This seed exists for compatibility between both the legacy arpa-reporter repo and ARPA Reporter tests
// running within GOST. In GOST, there is a separate tenants table with FKs to it, so the latter seeds
// fail if there is not already a row in the tenants table.
exports.seed = async function (knex) {
  const isGost = await isRunningInGOST(knex)
  if (!isGost) {
    return
  }

  await knex('tenants').insert([
    {
      id: 0,
      display_name: 'Tenant 0 for ARPA Reporter unit tests'
    },
    {
      id: 1,
      display_name: 'Tenant 1 for ARPA Reporter unit tests'
    }
  ])
}

// NOTE: This file was copied from tests/server/seeds/00_gost_tenants.js (git @ d124c44d0e) in the arpa-reporter repo on 2022-09-08T23:48:24.330Z
