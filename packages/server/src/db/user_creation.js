require('dotenv').config();

// This script creates a new staff user under a given tenant and agency.

const _ = require('lodash');
const inquirer = require('inquirer');
const { validate: validateEmail } = require('email-validator');
const knex = require('./connection');


// Adds a user with the given options into the database
async function createUser(options, trns = knex) {
    const { userEmail, userName, tenantId, agencyId } = options;
    const staffRole = await trns('roles')
        .select('*')
        .where('name', 'staff')
        .then((rows) => rows[0]);
    const { id } = await trns('users')
        .insert({
            email: userEmail,
            name: userName,
            tenant_id: tenantId,
            agency_id: agencyId,
            role_id: staffRole.id,
        })
        .returning('id')
        .then((rows) => rows[0]);
    return { id };
}

// Validator for well-formed email address and checks for duplicate emails
// (The db already has a unique constraint on email, but it's nice to give an error during data entry)
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

// Creates the question list to gather required user info
const buildInquirerQuestionsForCreateUserOptions = (trns) => [
    {
        name: 'userEmail',
        type: 'input',
        message: 'Email of user:',
        validate: (email) => validateUserEmail(email, trns),
        filter: (s) => s.toLowerCase(),
    },
    {
        name: 'userName',
        type: 'input',
        message: 'Display name of user:',
        validate: (s) => s.trim().length > 0 || 'User name required',
        default: (answers) => answers.userEmail,
    },
    {
        name: 'tenantId',
        type: 'list',
        message: 'Select a tenant for the user:',
        choices: async () => {
            const tenants = await trns('tenants').select(['id', 'display_name']);
            if (tenants.length < 1) {
                console.log('No tenants found. Did you run `yarn db:seed`?');
                process.exit(0);
            }
            return tenants.map(({id, display_name}) => ({
            name: display_name,
            value: id,
            }));
        },
    },
    {
        name: 'agencyId',
        type: 'list',
        message: 'Select an agency for the user:',
        choices: async ({tenantId}) => {
            const agencies = await trns('agencies')
                .select('id', 'name', 'abbreviation')
                .where('tenant_id', tenantId);
            return agencies.map(({id, name, abbreviation}) => ({
                name,
                short: abbreviation,
                value: id,
            }));
        },
    },
];

// Prompts the user for user data, and confirms at the end of the flow
async function promptForCreateUserOptions(trns = knex) {
  const questions = buildInquirerQuestionsForCreateUserOptions(trns);
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
  }
  return options;
}

// Main function: runs the prompt and creates the user
async function main() {
    await knex.transaction(async (trns) => {
        const options = await promptForCreateUserOptions(trns);
        const { id } = await createUser(options, trns);

        console.log('Created user', id, 'with email', options.userEmail);
        console.log('Note: no welcome email sent');
    });
}

if (require.main === module) {
    main().then(() => process.exit(0));
}
