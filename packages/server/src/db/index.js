/* eslint-disable no-await-in-loop */
/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */
const { v4 } = require('uuid');

const knex = require('./connection');
const { TABLES } = require('./constants');

async function getUsers() {
    const users = await knex('users')
        .select(
            'users.*',
            'roles.name as role_name',
            'roles.rules as role_rules',
            'agencies.name as agency_name',
            'agencies.abbreviation as agency_abbreviation',
            'agencies.parent as agency_parent_id_id',
        )
        .leftJoin('roles', 'roles.id', 'users.role_id')
        .leftJoin('agencies', 'agencies.id', 'users.agency_id');
    return users.map((user) => {
        const u = { ...user };
        if (user.role_id) {
            u.role = {
                id: user.role_id,
                name: user.role_name,
                rules: user.role_rules,
            };
        }
        if (user.agency_id !== null) {
            u.agency = {
                id: user.agency_id,
                name: user.agency_name,
                abbreviation: user.agency_abbreviation,
                agency_parent_id: user.agency_parent_id,
            };
        }
        return u;
    });
}
function deleteUser(id) {
    return knex('users')
        .where('id', id)
        .del();
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

async function getUser(id) {
    const [user] = await knex('users')
        .select(
            'users.id',
            'users.email',
            'users.role_id',
            'roles.name as role_name',
            'roles.rules as role_rules',
            'users.agency_id',
            'agencies.name as agency_name',
            'agencies.abbreviation as agency_abbreviation',
            'agencies.parent as agency_parent_id_id',
            'users.tags',
        )
        .leftJoin('roles', 'roles.id', 'users.role_id')
        .leftJoin('agencies', 'agencies.id', 'users.agency_id')
        .where('users.id', id);
    if (user.role_id) {
        user.role = {
            id: user.role_id,
            name: user.role_name,
            rules: user.role_rules,
        };
    }
    if (user.agency_id) {
        user.agency = {
            id: user.agency_id,
            name: user.agency_name,
            abbreviation: user.agency_abbreviation,
            agency_parent_id: user.agency_parent_id,
        };
    }
    return user;
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

function setAgencyEligibilityCodeEnabled(code, agencyId, enabled) {
    return knex(TABLES.agency_eligibility_codes)
        .where({
            agency_id: agencyId,
            code,
        })
        .update({ enabled });
}

function getKeywords() {
    return knex(TABLES.keywords)
        .select('*');
}

function createKeyword(keyword) {
    return knex
        .insert(keyword)
        .into(TABLES.keywords)
        .returning(['id', 'created_at'])
        .then((response) => ({
            ...keyword,
            id: response[0].id,
            created_at: response[0].created_at,
        }));
}

function deleteKeyword(id) {
    return knex(TABLES.keywords)
        .where('id', id)
        .del();
}

async function getGrants({ currentPage, perPage, filters } = {}) {
    const { data, pagination } = await knex(TABLES.grants)
        .select('*')
        .modify((queryBuilder) => {
            if (filters) {
                if (filters.eligibilityCodes) {
                    queryBuilder.where('eligibility_codes', '~', filters.eligibilityCodes.join('|'));
                }
                if (filters.keywords) {
                    queryBuilder.where('description', '~', filters.keywords.join('|'));
                }
            }
        })
        .paginate({ currentPage, perPage, isLengthAware: true });
    const viewedBy = await knex(TABLES.agencies)
        .join(TABLES.grants_viewed, `${TABLES.agencies}.id`, '=', `${TABLES.grants_viewed}.agency_id`)
        .whereIn('grant_id', data.map((grant) => grant.grant_id))
        .select(`${TABLES.grants_viewed}.grant_id`, `${TABLES.grants_viewed}.agency_id`, `${TABLES.agencies}.name`, `${TABLES.agencies}.abbreviation`);
    const interestedBy = await knex(TABLES.agencies)
        .join(TABLES.grants_interested, `${TABLES.agencies}.id`, '=', `${TABLES.grants_interested}.agency_id`)
        .whereIn('grant_id', data.map((grant) => grant.grant_id))
        .select(`${TABLES.grants_interested}.grant_id`, `${TABLES.grants_interested}.agency_id`, `${TABLES.agencies}.name`, `${TABLES.agencies}.abbreviation`);
    const dataWithAgency = data.map((grant) => {
        const viewedByAgencies = viewedBy.filter((viewed) => viewed.grant_id === grant.grant_id);
        const agenciesInterested = interestedBy.filter((intested) => intested.grant_id === grant.grant_id);
        return {
            ...grant,
            viewed_by_agencies: viewedByAgencies,
            interested_agencies: agenciesInterested,
        };
    });
    return { data: dataWithAgency, pagination };
}

function markGrantAsViewed({ grantId, agencyId, userId }) {
    return knex(TABLES.grants_viewed)
        .insert({ agency_id: agencyId, grant_id: grantId, user_id: userId });
}
function markGrantAsInterested({ grantId, agencyId, userId }) {
    return knex(TABLES.grants_interested)
        .insert({ agency_id: agencyId, grant_id: grantId, user_id: userId });
}

function getAgencies() {
    return knex(TABLES.agencies)
        .select('*')
        .orderBy('name');
}

function getAgencyEligibilityCodes(agencyId) {
    return knex(TABLES.agencies)
        .join(TABLES.agency_eligibility_codes, `${TABLES.agencies}.id`, '=', `${TABLES.agency_eligibility_codes}.agency_id`)
        .join(TABLES.eligibility_codes, `${TABLES.eligibility_codes}.code`, '=', `${TABLES.agency_eligibility_codes}.code`)
        .select('eligibility_codes.code', 'eligibility_codes.label', 'agency_eligibility_codes.enabled',
            'agency_eligibility_codes.created_at', 'agency_eligibility_codes.updated_at')
        .where('agencies.id', agencyId)
        .orderBy('code');
}

function getAgencyKeywords(agencyId) {
    return knex(TABLES.keywords)
        .select('*')
        .where('agency_id', agencyId);
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
    deleteUser,
    getUser,
    getRoles,
    createAccessToken,
    getAccessToken,
    markAccessTokenUsed,
    getAgencies,
    getAgencyEligibilityCodes,
    setAgencyEligibilityCodeEnabled,
    getKeywords,
    getAgencyKeywords,
    createKeyword,
    deleteKeyword,
    getGrants,
    markGrantAsViewed,
    markGrantAsInterested,
    getElegibilityCodes,
    sync,
    getAllRows,
    close,
};
