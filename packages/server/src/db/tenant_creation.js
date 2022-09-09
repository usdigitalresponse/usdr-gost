require('dotenv').config();

// This file contains logic for creating a new tenant. Creating a new tenant also creates a root agency for it
// and a single admin user (who can then login and make additional agencies/users within the tenant using UI).
// The logic in this file is called from both routes/tenants and as a standalone console script.

const _ = require('lodash');
const inquirer = require('inquirer');
const { validate: validateEmail } = require('email-validator');
const knex = require('./connection');

// Returns true if valid, error message string otherwise
async function validateTenantName(tenantName, trns = knex) {
    const existingTenants = await trns('tenants').select('*').where('display_name', tenantName);
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

// Returns true if valid, error message string otherwise
async function validateUserEmail(email, trns = knex) {
    if (!validateEmail(email)) {
        return 'Invalid email';
    }

    const existingUsers = await trns('users').select('*').where('email', email);
    if (existingUsers.length !== 0) {
        return 'User with that email already exists';
    }

    return true;
}

async function firstAgencyId(trns = knex) {
    // Don't want to assume 0 or 1 exist, they could have been deleted
    return trns('agencies').first('id').then((agency) => agency.id);
}

const buildInquirerQuestionsForCreateTenantOptions = (trns) => [
    {
        name: 'tenantName',
        type: 'input',
        message: 'Name of new tenant:',
        validate: (name) => validateTenantName(name, trns),
    },
    {
        name: 'agencyName',
        type: 'input',
        message: 'Name of root agency for new tenant:',
        validate: (s) => s.trim().length > 0 || 'Root agency name required',
        default: (answers) => answers.tenantName,
    },
    {
        name: 'agencyAbbreviation',
        type: 'input',
        message: 'Abbreviation of root agency for new tenant:',
        validate: (s) => s.trim().length > 0 || 'Root agency abbrev required',
    },
    {
        name: 'agencyCode',
        type: 'input',
        message: 'ARPA Reporter agency code of root agency for new tenant:',
        validate: (s) => s.trim().length > 0 || 'Root agency code required',
        default: (answers) => answers.agencyAbbreviation,
    },
    {
        name: 'adminUserEmail',
        type: 'input',
        message: 'Email of admin user:',
        validate: (email) => validateUserEmail(email, trns),
        filter: (s) => s.toLowerCase(),
    },
    {
        name: 'adminUserName',
        type: 'input',
        message: 'Display name of admin user:',
        validate: (s) => s.trim().length > 0 || 'Admin user name required',
        default: (answers) => answers.adminUserEmail,
    },
];

// Returns true if valid, error message string otherwise
async function validateCreateTenantOptions(options, trns = knex) {
    const questions = buildInquirerQuestionsForCreateTenantOptions(trns);

    // Make sure the options object has all the right keys and no extras
    const expectedKeys = _.map(questions, 'name');
    const actualKeys = Object.keys(options);
    const missingKeys = _.difference(expectedKeys, actualKeys);
    const extraKeys = _.difference(actualKeys, expectedKeys);
    if (missingKeys.length > 0) {
        return `Missing required options: ${missingKeys.join(', ')}`;
    }
    if (extraKeys.length > 0) {
        return `Unknown options: ${extraKeys.join(', ')}`;
    }

    const errors = (await Promise.all(questions.map(async (question) => {
        const validator = question.validate || (() => true);
        const valid = await validator(options[question.name]);
        return valid !== true ? valid : null;
    }))).filter(_.identity);

    if (errors.length > 0) {
        return errors.join('; ');
    }

    return true;
}

async function promptForCreateTenantOptions(trns = knex) {
    const questions = buildInquirerQuestionsForCreateTenantOptions(trns);
    const { confirmed, ...options } = await inquirer.prompt([
        ...questions,
        {
            name: 'confirmed',
            type: 'confirm',
            message: (answers) => {
                console.log(answers);
                return 'Everything look good?';
            },
        },
    ]);

    if (!confirmed) {
        console.log('Aborting');
        process.exit(0);
        return null;
    }

    return options;
}

async function createTenant(options, trns = knex) {
    const optionsValid = await validateCreateTenantOptions(options, trns);
    if (optionsValid !== true) {
        throw new Error(`invalid create tenant options: ${optionsValid}`);
    }
    const {
        tenantName, agencyName, agencyAbbreviation, agencyCode, adminUserEmail, adminUserName,
    } = options;

    // Seeded tenants, agencies, and users with fixed IDs can screw up the autoincrement, apparently
    await Promise.all(['tenants', 'agencies', 'users'].map((tableName) => trns.raw(`select setval('${tableName}_id_seq', max(id)) from ${tableName}`)));

    // Create tenant
    const { tenantId } = await trns('tenants')
        .insert({
            display_name: tenantName,
            // main_agency_id null because we haven't yet created the agency, so don't know its ID
            main_agency_id: null,
        })
        .returning('id as tenantId')
        .then((rows) => rows[0]);

    // Create root agency
    // We don't use db.createAgency because it expects a creatorId, but we are
    // creating in a new tenant that has no users yet.
    const { agencyId } = await trns('agencies')
        .insert({
            name: agencyName,
            abbreviation: agencyAbbreviation,
            code: agencyCode,
            parent: null,
            // main_agency_id is non-nullable, but trns.ref('id') doesn't seem to work. So we have
            // to set to an existing value, then update it afterward.
            //
            // TODO(mbroussard): should we remove the NOT NULL constraint and have null mean root
            // agency vs. having self-loops (similar to parent field)?
            main_agency_id: await firstAgencyId(trns),
            tenant_id: tenantId,
        })
        .returning('id as agencyId')
        .then((rows) => rows[0]);

    // Update main_agency_id
    await trns('agencies')
        .where('id', agencyId)
        .update({ main_agency_id: agencyId });
    await trns('tenants')
        .where('id', tenantId)
        .update({ main_agency_id: agencyId });

    // Create admin user
    const adminRole = await trns('roles')
        .select('*')
        .where('name', 'admin')
        .then((rows) => rows[0]);
    const { adminId } = await trns('users')
        .insert({
            email: adminUserEmail,
            name: adminUserName,
            tenant_id: tenantId,
            agency_id: agencyId,
            role_id: adminRole.id,
        })
        .returning('id as adminId')
        .then((rows) => rows[0]);

    console.log('Done');
    return { tenantId, agencyId, adminId };
}

async function main() {
    await knex.transaction(async (trns) => {
        const options = await promptForCreateTenantOptions(trns);
        const { tenantId, agencyId, adminId } = await createTenant(options, trns);

        console.log('Created tenant', tenantId);
        console.log('Created root agency', agencyId);
        console.log('Created root agency admin', adminId, 'with email', options.adminUserEmail);
        console.log('Note: no welcome email sent');
    });
}

module.exports = {
    createTenant,
    validateCreateTenantOptions,
};

if (require.main === module) {
    main().then(() => process.exit(0));
}
