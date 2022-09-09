require('dotenv').config();

const inquirer = require('inquirer');
const { validate: validateEmail } = require('email-validator');
const knex = require('../db/connection');

async function validateTenantName(tenantName) {
    const existingTenants = await knex('tenants').select('*').where('display_name', tenantName);
    if (existingTenants.length !== 0) {
        // This is not a SQL constraint, but it's confusing to have multiple tenants with the same
        // name and is most likely a mistake.
        return 'Tenant name already exists';
    }

    if (tenantName.trim().length === 0) {
        return 'Must specify a tenant name';
    }

    return true;
}

async function validateUserEmail(email) {
    if (!validateEmail(email)) {
        return 'Invalid email';
    }

    const existingUsers = await knex('users').select('*').where('email', email);
    if (existingUsers.length !== 0) {
        return 'User with that email already exists';
    }

    return true;
}

async function firstAgencyId() {
    // Don't want to assume 0 or 1 exist, they could have been deleted
    return knex('agencies').first('id').then((agency) => agency.id);
}

async function main() {
    const { tenantName, agency, adminUser } = await inquirer.prompt([
        {
            name: 'tenantName',
            type: 'input',
            message: 'Name of new tenant:',
            validate: validateTenantName,
        },
        {
            name: 'agency.name',
            type: 'input',
            message: 'Name of root agency for new tenant:',
            validate: (s) => s.trim().length > 0 || 'Root agency name required',
            default: (answers) => answers.tenantName,
        },
        {
            name: 'agency.abbreviation',
            type: 'input',
            message: 'Abbreviation of root agency for new tenant:',
            validate: (s) => s.trim().length > 0 || 'Root agency abbrev required',
        },
        {
            name: 'agency.code',
            type: 'input',
            message: 'ARPA Reporter agency code of root agency for new tenant:',
            validate: (s) => s.trim().length > 0 || 'Root agency code required',
            default: (answers) => answers.agency.abbreviation,
        },
        {
            name: 'adminUser.email',
            type: 'input',
            message: 'Email of admin user:',
            validate: validateUserEmail,
            filter: (s) => s.toLowerCase(),
        },
        {
            name: 'adminUser.name',
            type: 'input',
            message: 'Display name of admin user:',
            validate: (s) => s.trim().length > 0 || 'Admin user name required',
            default: (answers) => answers.adminEmail,
        },
    ]);

    // Seeded tenants, agencies, and users with fixed IDs can screw up the autoincrement, apparently
    await Promise.all(['tenants', 'agencies', 'users'].map((tableName) => knex.raw(`select setval('${tableName}_id_seq', max(id)) from ${tableName}`)));

    // Create tenant
    const { tenantId } = await knex('tenants')
        .insert({
            display_name: tenantName,
            // main_agency_id null because we haven't yet created the agency, so don't know its ID
            main_agency_id: null,
        })
        .returning('id as tenantId')
        .then((rows) => rows[0]);
    console.log('Created tenant', tenantId);

    // Create root agency
    // We don't use db.createAgency because it expects a creatorId, but we are
    // creating in a new tenant that has no users yet.
    const { agencyId } = await knex('agencies')
        .insert({
            ...agency,
            parent: null,
            // main_agency_id is non-nullable, but knex.ref('id') doesn't seem to work. So we have
            // to set to an existing value, then update it afterward.
            //
            // TODO(mbroussard): should we remove the NOT NULL constraint and have null mean root
            // agency vs. having self-loops?
            main_agency_id: await firstAgencyId(),
            tenant_id: tenantId,
        })
        .returning('id as agencyId')
        .then((rows) => rows[0]);
    console.log('Created root agency', agencyId);

    // Update main_agency_id
    await knex('agencies')
        .where('id', agencyId)
        .update({ main_agency_id: agencyId });
    await knex('tenants')
        .where('id', tenantId)
        .update({ main_agency_id: agencyId });

    // Create admin user
    const adminRole = await knex('roles')
        .select('*')
        .where('name', 'admin')
        .then((rows) => rows[0]);
    const { adminId } = await knex('users')
        .insert({
            ...adminUser,
            tenant_id: tenantId,
            agency_id: agencyId,
            role_id: adminRole.id,
        })
        .returning('id as adminId')
        .then((rows) => rows[0]);
    console.log('Created root agency admin', adminId, 'with email', adminUser.email);

    console.log('Done');
}

if (require.main === module) {
    main().then(() => process.exit(0));
}
