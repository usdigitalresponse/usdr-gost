/* eslint camelcase: 0 */

/*
--------------------------------------------------------------------------------
-                           db/reporting-periods.js
--------------------------------------------------------------------------------

  A reporting_periods record in postgres looks like this:

               Column             |           Type           |
  --------------------------------+--------------------------+
   id                             | integer                  |
   name                           | text                     |
   start_date                     | date                     |
   end_date                       | date                     |
   certified_at                   | timestamp with time zone |
   certified_by                   | text                     |
   reporting_template             | text                     |
*/
const knex = require('../../db/connection');
const { cleanString } = require('../lib/spreadsheet');

const {
    getCurrentReportingPeriodID,
    setCurrentReportingPeriod,
} = require('./settings');
const { useTenantId, useRequest } = require('../use-request');

module.exports = {
    getReportingPeriod,
    closeReportingPeriod,
    getReportingPeriodID,
    getPreviousReportingPeriods,
    getAllReportingPeriods,
    createReportingPeriod,
    updateReportingPeriod,
};

function baseQuery(trns) {
    return trns('reporting_periods')
        .select(
            'reporting_periods.*',
            'users.email AS certified_by_email',
        )
        .leftJoin('users', 'reporting_periods.certified_by', 'users.id');
}

async function getAllReportingPeriods(trns = knex) {
    const tenantId = useTenantId();
    return baseQuery(trns).where('reporting_periods.tenant_id', tenantId).orderBy('end_date', 'desc');
}

/* getReportingPeriod() returns a record from the reporting_periods table.
  */
async function getReportingPeriod(period_id = undefined, trns = knex) {
    const tenantId = useTenantId();

    if (period_id && Number(period_id)) {
        return baseQuery(trns)
            .where('reporting_periods.tenant_id', tenantId)
            .where('reporting_periods.id', period_id)
            .then((r) => r[0]);
    } if (period_id === undefined) {
        return baseQuery(trns)
            .where('reporting_periods.tenant_id', tenantId)
            .where('application_settings.tenant_id', tenantId)
            .innerJoin('application_settings', 'reporting_periods.id', 'application_settings.current_reporting_period_id')
            .then((r) => r[0]);
    }
    return null;
}

/*  getPeriodID() returns the argument unchanged unless it is falsy, in which
  case it returns the current reporting period ID.
  */
async function getReportingPeriodID(periodID) {
    return Number(periodID) || getCurrentReportingPeriodID();
}

/**
 * Get all reporting periods that either match supplied period ID or are older
 * than supplied period ID.
 *
 * @returns The matching reporting periods, sorted from oldest to newest by date
 */
async function getPreviousReportingPeriods(period_id, trns = knex) {
    const currentReportingPeriod = await getReportingPeriod(period_id);
    const allReportingPeriods = await getAllReportingPeriods();
    const reportingPeriods = allReportingPeriods.filter(
        (period) => new Date(period.end_date) <= new Date(currentReportingPeriod.end_date),
    );
    reportingPeriods.sort((a, b) => new Date(a.end_date) - new Date(b.end_date));
    return reportingPeriods;
}

async function closeReportingPeriod(period, trns = knex) {
    const { user } = useRequest().session;
    const tenantId = useTenantId();
    if (user.tenant_id !== period.tenant_id) {
        throw new Error('user cannot close reporting period of a different tenant');
    }

    const currentPeriodID = await getCurrentReportingPeriodID(trns);

    if (period.id !== currentPeriodID) {
        throw new Error(
            `Cannot close period ${period.name} -- it is not the current reporting period`,
        );
    }

    if (period.certified_at) {
        throw new Error(
            `Reporting period ${period.id} is already closed`,
        );
    }

    const prior = await trns('reporting_periods')
        .where('tenant_id', tenantId)
        .where('start_date', '<', period.start_date)
        .orderBy('start_date', 'desc')
        .limit(1)
        .then((rows) => rows[0]);
    if (prior && !prior.certified_at) {
        throw new Error(
            `Prior reporting period (${prior.name}) is not closed`,
        );
    }

    console.log(`closing period ${period}`);

    // TODO: Should we be writing summaries?  What are summaries used for?
    // const errLog = await writeSummaries(reporting_period_id)

    // if (errLog && errLog.length > 0) {
    //   console.dir(errLog, { depth: 4 })
    //   throw new Error(errLog[0])
    // }

    await trns('reporting_periods')
        .where({ id: period.id })
        .update({
            certified_at: knex.fn.now(),
            certified_by: user.id,
        });

    const next = await trns('reporting_periods')
        .where('tenant_id', tenantId)
        .where('start_date', '>', period.start_date)
        .orderBy('start_date', 'asc')
        .limit(1)
        .then((rows) => rows[0]);

    await setCurrentReportingPeriod(next.id, trns);
}

async function createReportingPeriod(reportingPeriod, trns = knex) {
    const tenantId = useTenantId();

    return trns
        .insert({ ...reportingPeriod, tenant_id: tenantId })
        .into('reporting_periods')
        .returning(['id'])
        .then((response) => ({
            ...reportingPeriod,
            id: response[0].id,
        }));
}

function updateReportingPeriod(reportingPeriod, trns = knex) {
    return trns('reporting_periods')
        .where('id', reportingPeriod.id)
        .update({
            name: cleanString(reportingPeriod.name),
            start_date: reportingPeriod.start_date,
            end_date: reportingPeriod.end_date,
            template_filename: reportingPeriod.template_filename,
            // tenant_id is immutable
        });
}

/*                                 *  *  *                                    */

// NOTE: This file was copied from src/server/db/reporting-periods.js (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z
