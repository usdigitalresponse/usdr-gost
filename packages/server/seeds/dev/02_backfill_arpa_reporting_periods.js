const _ = require('lodash');
const moment = require('moment');

// This seed is loosely based on seeds/04_reporting_periods.js and seeds/05_app_settings.js in the
// legacy ARPA Reporter repo with some manual adjustments for use in GOST.
//
// In dev, this will run automatically when calling yarn db:seed and is intended to run _after_ all
// existing GOST seeds. In prod, this seed (only) will be run manually once to backfill existing
// tenants to have reporting_periods/application_settings rows.

async function seedReportingPeriods(knex, tenantId) {
    const [{ count }] = await knex('reporting_periods')
        .where('tenant_id', tenantId)
        .count('name', { as: 'count' });
    if (count !== '0') {
        throw new Error(`db already has ${count} reporting periods for tenant ${tenantId}...`);
    }

    // first period is all of 2021
    const periods = [
        {
            name: 'Quarterly 1',
            start_date: '2021-03-03',
            end_date: '2021-12-31',
            tenant_id: tenantId,
        },
    ];

    const mstr = (mdate) => mdate.format('YYYY-MM-DD');

    // generate array of reporting periods, starting from right after the first period
    // reporting periods loosely based on tables 3 and 4 from here:
    // https://home.treasury.gov/system/files/136/SLFRF-Compliance-and-Reporting-Guidance.pdf
    const start = moment(periods[0].end_date).add(1, 'days');
    const finalStart = moment('2026-10-01');
    while (!start.isAfter(finalStart)) {
        const end = start.clone().add(2, 'months').endOf('month');

        periods.push({
            name: `Quarterly ${periods.length + 1}`,
            start_date: mstr(start),
            end_date: mstr(end),
            tenant_id: tenantId,
        });

        start.add(3, 'months');
    }

    await knex('reporting_periods').insert(periods);
}

async function seedApplicationSettings(knex, tenantId) {
    const existing = await knex('application_settings').select('*');
    if (existing.length !== 0) {
        throw new Error(`db already has an application_settings row for tenant ${tenantId}...`);
    }

    // TODO(mbroussard): Is this right? Should we instead pick one close to the current date?
    const { firstPeriod } = await knex('reporting_periods')
        .where('tenant_id', tenantId)
        .first('id AS firstPeriod');

    await knex('application_settings').insert(
        { title: 'ARPA Reporter', current_reporting_period_id: firstPeriod, tenant_id: tenantId },
    );
}

const seed = async function (knex) {
    const tenants = await knex('tenants')
        .leftJoin('reporting_periods', 'tenants.id', 'reporting_periods.tenant_id')
        .leftJoin(
            'application_settings',
            'tenants.id',
            'application_settings.tenant_id',
        )
        .select('tenants.id as tenantId')
        .count('reporting_periods.*', { as: 'reportingPeriodsCount' })
        .count('application_settings.*', { as: 'applicationSettingsCount' })
        .groupBy('tenants.id')
        .then(
            // Knex returns count fields as stringified number, we want to deal with just numbers
            (rows) => rows.map((row) => _.mapValues(row, Number)),
        );

    await Promise.all(tenants.map(
        async ({ tenantId, reportingPeriodsCount, applicationSettingsCount }) => {
            if (reportingPeriodsCount === 0) {
                console.log('Backfilling reporting_periods for tenant', tenantId);
                await seedReportingPeriods(knex, tenantId);
            }

            if (applicationSettingsCount === 0) {
                console.log('Backfilling application_settings for tenant', tenantId);
                await seedApplicationSettings(knex, tenantId);
            }
        },
    ));
};

module.exports = {
    seed,
    seedReportingPeriods,
    seedApplicationSettings,
};
