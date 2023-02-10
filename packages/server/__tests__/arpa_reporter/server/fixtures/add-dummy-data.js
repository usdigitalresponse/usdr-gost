require('dotenv').config();
const conn = require('../../../../src/db/connection');
const { isRunningInGOST } = require('../helpers/is_gost');

const setupAgencies = async (knex) => {
    const isGost = await isRunningInGOST(knex);

    return knex('agencies').insert([
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
    ].map(
    // GOST has a non-null main_agency_id field on agencies that legacy arpa-reporter does not have
        (row) => (isGost ? ({ ...row, main_agency_id: row.id }) : row),
    )).then(() => 'Agency data added OK');
};

module.exports = {
    setupAgencies,
};

// Run this file directly through node to set up dummy data for manual testing.
if (require.main === module) {
    setupAgencies(conn).then(() => {
        conn.destroy();
    });
}

// NOTE: This file was copied from tests/server/fixtures/add-dummy-data.js (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z
