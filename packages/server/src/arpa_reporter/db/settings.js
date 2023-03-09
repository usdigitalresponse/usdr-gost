const knex = require('../../db/connection');
const { requiredArgument } = require('../lib/preconditions');
const { useTenantId } = require('../use-request');

function setCurrentReportingPeriod(id, trns = knex) {
    const tenantId = useTenantId();
    requiredArgument(id, 'must specify id in setCurrentReportingPeriod');

    return trns('application_settings')
        .where('tenant_id', tenantId)
        .update('current_reporting_period_id', id);
}

async function getCurrentReportingPeriodID(trns = knex) {
    const tenantId = useTenantId();

    return trns('application_settings')
        .select('*')
        .where('tenant_id', tenantId)
        .then((r) => r[0].current_reporting_period_id);
}

async function applicationSettings(trns = knex) {
    const tenantId = useTenantId();

    return await trns('application_settings')
        .join(
            'reporting_periods',
            'application_settings.current_reporting_period_id',
            'reporting_periods.id',
        )
        .select('*')
        .where('application_settings.tenant_id', tenantId)
        .then((rows) => rows[0]);
}

module.exports = {
    applicationSettings,
    getCurrentReportingPeriodID,
    setCurrentReportingPeriod,
};

// NOTE: This file was copied from src/server/db/settings.js (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z
