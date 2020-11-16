/* eslint-disable no-await-in-loop */
/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */
const { v4 } = require('uuid');

const knex = require('./connection');
const { TABLES } = require('./constants');

function getUsers() {
    return knex('users')
        .select('*')
        .orderBy('email');
}

function createUser(user) {
    return knex
        .insert(user)
        .into('users')
        .returning(['id', 'created_at'])
        .then((response) => ({
            ...user,
            id: response[0].id,
            created_at: response[0].created_at,
        }));
}

function getUser(id) {
    return knex('users')
        .select('*')
        .where('id', id)
        .then((r) => r[0]);
}

function getUserAndRole(id) {
    return knex('users')
        .join('roles', 'roles.name', 'users.role')
        .select(
            'users.id',
            'users.email',
            'users.role',
            'users.agency_id',
            'users.tags',
            'roles.rules',
        )
        .where('users.id', id)
        .then((r) => r[0]);
}

function getRoles() {
    return knex('roles')
        .select('*')
        .orderBy('name');
}

function getAccessToken(passcode) {
    return knex('access_tokens')
        .select('*')
        .where('passcode', passcode)
        .then((r) => r[0]);
}

function markAccessTokenUsed(passcode) {
    return knex('access_tokens')
        .where('passcode', passcode)
        .update({ used: true });
}

async function generatePasscode(email) {
    console.log('generatePasscode for :', email);
    const users = await knex('users')
        .select('*')
        .where('email', email);
    if (users.length === 0) {
        throw new Error(`User '${email}' not found`);
    }
    const passcode = v4();
    const used = false;
    const expiryMinutes = 30;
    const expires = new Date();
    expires.setMinutes(expires.getMinutes() + expiryMinutes);
    await knex('access_tokens').insert({
        user_id: users[0].id,
        passcode,
        expires,
        used,
    });
    return passcode;
}

function createAccessToken(email) {
    return generatePasscode(email);
}

function getElegibilityCodes() {
    return knex(TABLES.eligibility_codes)
        .select('*');
}

function getKeywords() {
    return knex(TABLES.keywords)
        .select('*');
}

async function getGrants({ currentPage, perPage } = {}) {
    const { data, pagination } = await knex(TABLES.grants)
        .select('*').paginate({ currentPage, perPage, isLengthAware: true });
    const viewedBy = await knex(TABLES.agencies)
        .join(TABLES.grants_viewed, `${TABLES.agencies}.id`, '=', `${TABLES.grants_viewed}.agency_id`)
        .whereIn('grant_id', data.map((grant) => grant.grant_id))
        .select(`${TABLES.grants_viewed}.grant_id`, `${TABLES.grants_viewed}.agency_id`, `${TABLES.agencies}.name`);
    const dataWithAgency = data.map((grant) => {
        const viewedByAgencies = viewedBy.filter((viewed) => viewed.grant_id === grant.grant_id);
        return {
            ...grant,
            viewed_by_agencies: viewedByAgencies,
            viewed_by_agencies_formatted: viewedByAgencies.map((v) => v.name).join(', '),
        };
    });
    return { data: dataWithAgency, pagination };
}

function markGrantAsViewed({ grantId, agencyId }) {
    return knex(TABLES.grants_viewed)
        .insert({ agency_id: agencyId, grant_id: grantId });
}

function getAgencies() {
    return knex(TABLES.agencies)
        .select('*')
        .orderBy('name');
}

function getAgencyByCode(code) {
    return knex(TABLES.agencies)
        .select('*')
        .where({ code });
}

async function createRecord(tableName, row) {
    return knex(tableName).insert(row);
}

async function updateRecord(tableName, syncKey, key, row) {
    return knex(tableName)
        .where({ [syncKey]: key })
        .update({
            ...row,
            updated_at: new Date(),
        });
}

async function getAllRows(tableName, syncKey, fetchCols) {
    const fields = fetchCols.slice(0);
    fields.push(syncKey);

    const rows = {};
    const records = await knex.select('*').from(tableName);
    records.forEach((record) => {
        rows[record[syncKey]] = record;
    });
    return rows;
}

async function sync(tableName, syncKey, updateCols, newRows) {
    const oldRows = await getAllRows(tableName, syncKey, updateCols);
    const alreadyUpdated = {};
    for (const i in newRows) {
        const newRow = newRows[i];
        const syncKeyValue = newRow[syncKey];
        if (alreadyUpdated[syncKeyValue]) {
            // already creating an item with this syncKey; do nothing
        } else if (oldRows[syncKeyValue]) {
            // already inserted, check if updates are necessary
            alreadyUpdated[syncKeyValue] = true;

            const updatedFields = {};
            updateCols.forEach((col) => {
                if (oldRows[syncKeyValue][col] !== newRow[col]) {
                    updatedFields[col] = newRow[col];
                }
            });

            if (Object.values(updatedFields).length > 0) {
                try {
                    await updateRecord(tableName, syncKey, oldRows[syncKeyValue][syncKey], updatedFields);
                    console.log(`updated ${oldRows[syncKeyValue][syncKey]} in ${tableName}`);
                } catch (err) {
                    console.error(`knex error when updating ${oldRows[syncKeyValue][syncKey]} with ${JSON.stringify(updatedFields)}: ${err}`);
                }
            }
        } else {
            // does not exist, insert!
            alreadyUpdated[syncKeyValue] = true;
            try {
                await createRecord(tableName, newRow);
                console.log(`created ${newRow[syncKey]} in ${tableName}`);
            } catch (err) {
                console.error(`knex error when creating a new row with ${JSON.stringify(newRow)}: ${err}`);
            }
        }
    }
}

function close() {
    return knex.destroy();
}

module.exports = {
    getUsers,
    createUser,
    getUser,
    getUserAndRole,
    getRoles,
    createAccessToken,
    getAccessToken,
    markAccessTokenUsed,
    getAgencies,
    getAgencyByCode,
    getKeywords,
    getGrants,
    markGrantAsViewed,
    getElegibilityCodes,
    sync,
    getAllRows,
    close,
};
