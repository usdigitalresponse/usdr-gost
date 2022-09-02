require('dotenv').config()

// NOTE(mbroussard): For now this seed only populates reporting periods for a single tenant with
// the default tenantId 0 (though you can modify this to manually populate for other tenantIds).
// In ARPA Reporter-only deployments, there will only be a single tenant anyway so this is fine.
// Once ARPA Reporter is merged into GOST, there are multiple tenants and when a new tenant is
// created it will need reporting periods created for it.

// reporting periods loosely based on tables 3 and 4 from here:
// https://home.treasury.gov/system/files/136/SLFRF-Compliance-and-Reporting-Guidance.pdf
//
// when making changes to this file, consider also updating the test seed:
// tests/server/seeds/07_reporting_periods.js
exports.seed = async function (knex, tenantId = 0) {
  const [{ count }] = await knex('reporting_periods')
    .where('tenant_id', tenantId)
    .count('name', { as: 'count' })
  if (count !== '0') {
    console.log(`db already has ${count} reporting periods for tenant ${tenantId}...`)
    return
  }

  // first period is all of 2021
  const periods = [
    {
      name: 'Quarterly 1',
      start_date: '2021-03-03',
      end_date: '2021-12-31',
      tenant_id: tenantId
    }
  ]

  const moment = require('moment')
  const mstr = (mdate) => mdate.format('YYYY-MM-DD')

  // generate array of reporting periods, starting from right after the first period
  const start = moment(periods[0].end_date).add(1, 'days')
  const finalStart = moment('2026-10-01')
  while (!start.isAfter(finalStart)) {
    const end = start.clone().add(2, 'months').endOf('month')

    periods.push({
      name: `Quarterly ${periods.length + 1}`,
      start_date: mstr(start),
      end_date: mstr(end),
      tenant_id: tenantId
    })

    start.add(3, 'months')
  }

  await knex('reporting_periods').insert(periods)
}

// NOTE: This file was copied from seeds/04_reporting_periods.js (git @ 98c1aa2586) in the arpa-reporter repo on 2022-09-02T05:09:55.179Z
