/* eslint-disable global-require */
const setupAgencies = async (knex) => knex('agencies').insert([
    {
        id: 1, name: 'Generic Government', code: 'GOV', tenant_id: 0,
    },
    {
        id: 2, name: 'Office of Management and Budget', code: 'OMB', tenant_id: 0,
    },
    {
        id: 3, name: 'Department of Health', code: 'DOH', tenant_id: 0,
    },
    {
        id: 4, name: 'Executive Office of Health and Human Services', code: 'EOHHS', tenant_id: 0,
    },
].map((row) => row)).then(() => 'Agency data added OK');

module.exports = {
    setupAgencies,
};

// Run this file directly through node to set up dummy data for manual testing.
if (require.main === module) {
    require('dotenv').config();
    const knex = require('../../../../src/db/connection');
    setupAgencies(knex).then(() => {
        knex.destroy();
    });
}

// NOTE: This file was copied from tests/server/fixtures/add-dummy-data.js (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z
