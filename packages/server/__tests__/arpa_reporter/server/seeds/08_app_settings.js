require('dotenv').config();

exports.seed = async function (knex) {
    await knex('application_settings').del();
    await knex('application_settings').insert([
        { tenant_id: 0, title: 'Rhode Island', current_reporting_period_id: 1 },
        { tenant_id: 1, title: 'California', current_reporting_period_id: 22 },
    ]);
};

// NOTE: This file was copied from tests/server/seeds/08_app_settings.js (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z
