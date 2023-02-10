require('dotenv').config();
const moment = require('moment');

// when making changes to this file, consider also updating the non-test seed:
// seeds/04_reporting_periods.js
exports.seed = async function (knex) {
    await knex('reporting_periods').del();

    // first period is all of 2021
    const periods = [
        {
            name: 'Quarterly 1',
            start_date: '2021-03-03',
            end_date: '2021-12-31',
        },
    ];

    const mstr = (mdate) => mdate.format('YYYY-MM-DD');

    // generate array of reporting periods, starting from right after the first period
    const start = moment(periods[0].end_date).add(1, 'days');
    const finalStart = moment('2026-10-01');
    while (!start.isAfter(finalStart)) {
        const end = start.clone().add(2, 'months').endOf('month');

        periods.push({
            name: `Quarterly ${periods.length + 1}`,
            start_date: mstr(start),
            end_date: mstr(end),
        });

        start.add(3, 'months');
    }

    // NOTE(mbroussard): We create reporting periods for 2 different tenants for the purpose of unit tests
    // even though in prod ARPA Reporter-only deployments there will only ever be one; the multitenant
    // support is intended for an eventual merge into GOST, which already has multiple tenants.
    const tenantIds = [0, 1];
    const periodsToInsert = tenantIds.map(
        (tenantId) => periods.map(
            (period) => ({ ...period, tenant_id: tenantId }),
        ),
    ).flat();

    await knex('reporting_periods').insert(periodsToInsert);
};

// NOTE: This file was copied from tests/server/seeds/07_reporting_periods.js (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z
