require('dotenv').config()

// NOTE(mbroussard): For now this seed only populates application_settings for a single tenant with
// the default tenantId 0 (though you can modify this to manually populate for other tenantIds).
// In ARPA Reporter-only deployments, there will only be a single tenant anyway so this is fine.
// Once ARPA Reporter is merged into GOST, there are multiple tenants and when a new tenant is
// created it will need an application_settings row created for it.

const title = (process.env.INITIAL_APP_TITLE || 'ARPA Reporter')

exports.seed = async function (knex, tenantId = 0) {
  const [{ count }] = await knex('application_settings')
    .where('tenant_id', tenantId)
    .count('title', { as: 'count' })
  if (count !== '0') {
    console.log(`db already has application settings for tenant ${tenantId}...`)
    return
  }

  const { firstPeriod } = await knex('reporting_periods')
    .where('tenant_id', tenantId)
    .first('id AS firstPeriod')

  await knex('application_settings').insert([
    { title, current_reporting_period_id: firstPeriod, tenant_id: tenantId }
  ])
}

// NOTE: This file was copied from seeds/05_app_settings.js (git @ 98c1aa2586) in the arpa-reporter repo on 2022-09-02T05:09:55.179Z
