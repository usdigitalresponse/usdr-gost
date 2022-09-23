// This file exists as a shim to replace ARPA Reporter's db/users.js
// Eventually, the functions in this file should have callsites updated to use GOST's existing methods
// and this file can be deleted.

const knex = require('../connection');
const gostDb = require('..');

const { useTenantId, useUser } = require('../../arpa_reporter/use-request');

async function agencies() {
    const tenantId = useTenantId();
    const tenant = await knex('tenants')
        .where('id', tenantId)
        .select('*')
        .then((rows) => rows[0]);
    const mainAgencyId = tenant.main_agency_id;

    return gostDb.getAgencies(mainAgencyId);
}

async function agencyById(id) {
    const rows = await gostDb.getAgency(id);
    return rows[0];
}

function agencyByCode(code) {
    const tenantId = useTenantId();
    return knex('agencies')
        .select('*')
        .where({ tenant_id: tenantId, code });
}

async function createAgency(agency) {
    const tenantId = useTenantId();
    const { main_agency_id } = await knex('tenants')
        .select('main_agency_id')
        .where('id', tenantId)
        .then((rows) => rows[0]);
    const creator = useUser();

    return gostDb.createAgency({
        ...agency,
        parent: main_agency_id,
        abbreviation: agency.code,
        warning_threshold: 30,
        danger_threshold: 15,
        tenant_id: tenantId,
    }, creator.id);
}

async function updateAgency(agency) {
    await gostDb.setAgencyName(agency.id, agency.name);
    await knex('agencies')
        .where('id', agency.id)
        .update({ code: agency.code });

    return gostDb.getAgency(agency.id);
}

module.exports = {
    agencies,
    agencyById,
    agencyByCode,
    createAgency,
    updateAgency,
};
