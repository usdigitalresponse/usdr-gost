require('dotenv').config();

const db = require('../db');

const userInputArgs = process.argv.slice(2);

const addNewTenant = async (args) => {
    const nameArg = args[0];
    const agencyIdArg = args[1];
    try {
        const isValidTenantName = nameArg && nameArg.match(/tenantName=[\w\d\s]+/);
        const isValidAgency = agencyIdArg && agencyIdArg.match(/agencyId=\d+/);
        if (!isValidTenantName || !isValidAgency) {
            throw new Error('Valid tenant name and agency ID is required');
        }
        const tenantName = nameArg.slice(11);
        const tenantAgencyId = Number(agencyIdArg.slice(9));

        const agency = await db.getAgency(tenantAgencyId);

        if (!agency.length) {
            throw new Error('No Agency with this ID exists');
        }
        const tenant = {
            display_name: tenantName,
            main_agency_id: tenantAgencyId,
        };
        const result = await db.createTenant(tenant);
        console.log(result);
        db.close();

        return result;
    } catch (error) {
        console.log(error.message);
        return db.close();
    }
};

addNewTenant(userInputArgs);
