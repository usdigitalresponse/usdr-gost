// This file exists as a shim to replace ARPA Reporter's db/users.js
// Eventually, the functions in this file should have callsites updated to use GOST's existing methods
// and this file can be deleted.

const knex = require('../connection');
const gostDb = require('..');

// TODO(mbroussard): after merge, replace with an import to ARPA's use-request module
function useTenantId() {
    throw new Error('import missing -- need to update after ARPA merge');
}
function useUser() {
    throw new Error('import missing -- need to update after ARPA merge');
}

async function agencies() {
    const tenantId = useTenantId();
    const tenant = await knex('tenants')
        .where('id', tenantId)
        .select('*')
        .then((rows) => rows[0]);
    const mainAgencyId = tenant.main_agency_id;

    return gostDb.getAgencies(mainAgencyId);
}

function agencyById(id) {
    return gostDb.getAgency(id);
}

function agencyByCode(code) {
    const tenantId = useTenantId();
    return knex('agencies')
        .select('*')
        .where({ tenant_id: tenantId, code });
}

function createAgency(agency) {
    const tenantId = useTenantId();
    const creator = useUser();
    return gostDb.createAgency({ ...agency, tenant_id: tenantId }, creator.id);
}

async function updateAgency(agency) {
    await gostDb.setAgencyName(agency.name);
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
