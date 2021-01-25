/* eslint-disable no-use-before-define */
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

async function createUser(user) {
    const response = await knex
        .insert(user)
        .into('users')
        .returning(['id', 'created_at']);
    return {
        ...user,
        id: response[0].id,
        created_at: response[0].created_at,
    };
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

async function getAccessToken(passcode) {
    const result = await knex('access_tokens')
        .select('*')
        .where('passcode', passcode);
    return result[0];
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

async function createKeyword(keyword) {
    const response = await knex
        .insert(keyword)
        .into(TABLES.keywords)
        .returning(['id', 'created_at']);
    return {
        ...keyword,
        id: response[0].id,
        created_at: response[0].created_at,
    };
}

function deleteKeyword(id) {
    return knex(TABLES.keywords)
        .where('id', id)
        .del();
}

async function getGrants({
    currentPage, perPage, filters, orderBy, searchTerm,
} = {}) {
    const { data, pagination } = await knex(TABLES.grants)
        .select(`${TABLES.grants}.*`)
        .modify((queryBuilder) => {
            if (searchTerm && searchTerm !== 'null') {
                queryBuilder.orWhere('grant_id', '~*', searchTerm);
                queryBuilder.orWhere('grant_number', '~*', searchTerm);
                queryBuilder.orWhere('title', '~*', searchTerm);
            }
            if (filters) {
                if (filters.eligibilityCodes) {
                    queryBuilder.where('eligibility_codes', '~', filters.eligibilityCodes.join('|'));
                }
                if (filters.keywords) {
                    queryBuilder.where('description', '~*', filters.keywords.join('|'));
                }
            }
            if (orderBy && orderBy !== 'undefined') {
                if (orderBy.includes('interested_agencies')) {
                    queryBuilder.leftJoin(TABLES.grants_interested, `${TABLES.grants}.grant_id`, `${TABLES.grants_interested}.grant_id`);
                    queryBuilder.distinctOn(`${TABLES.grants}.grant_id`, `${TABLES.grants_interested}.grant_id`);
                    const orderArgs = orderBy.split('|');
                    queryBuilder.orderBy(`${TABLES.grants_interested}.grant_id`, orderArgs[1]);
                    queryBuilder.orderBy(`${TABLES.grants}.grant_id`, orderArgs[1]);
                } else if (orderBy.includes('viewed_by')) {
                    const orderArgs = orderBy.split('|');
                    queryBuilder.leftJoin(TABLES.grants_viewed, `${TABLES.grants}.grant_id`, `${TABLES.grants_viewed}.grant_id`);
                    queryBuilder.distinctOn(`${TABLES.grants}.grant_id`, `${TABLES.grants_viewed}.grant_id`);
                    queryBuilder.orderBy(`${TABLES.grants_viewed}.grant_id`, orderArgs[1]);
                    queryBuilder.orderBy(`${TABLES.grants}.grant_id`, orderArgs[1]);
                } else {
                    const orderArgs = orderBy.split('|');
                    queryBuilder.orderBy(...orderArgs);
                }
            }
        })
        .paginate({ currentPage, perPage, isLengthAware: true });
    const viewedBy = await knex(TABLES.agencies)
        .join(TABLES.grants_viewed, `${TABLES.agencies}.id`, '=', `${TABLES.grants_viewed}.agency_id`)
        .whereIn('grant_id', data.map((grant) => grant.grant_id))
        .select(`${TABLES.grants_viewed}.grant_id`, `${TABLES.grants_viewed}.agency_id`, `${TABLES.agencies}.name as agency_name`, `${TABLES.agencies}.abbreviation as agency_abbreviation`);
    const interestedBy = await getInterestedAgencies({ grantIds: data.map((grant) => grant.grant_id) });
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

async function getTotalGrants() {
    const rows = await knex(TABLES.grants).count();
    return rows[0].count;
}

async function getTotalViewedGrants() {
    const rows = await knex(TABLES.grants_viewed).count();
    return rows[0].count;
}

async function getTotalInteresedGrants() {
    const rows = await knex(TABLES.grants_interested).count();
    return rows[0].count;
}

async function getTotalInterestedGrantsByAgencies() {
    const rows = await knex(TABLES.grants_interested)
        .select(`${TABLES.grants_interested}.agency_id`, `${TABLES.agencies}.name`, `${TABLES.agencies}.abbreviation`)
        .join(TABLES.agencies, `${TABLES.grants_interested}.agency_id`, `${TABLES.agencies}.id`)
        .count(`${TABLES.grants_interested}.agency_id`)
        .groupBy(`${TABLES.grants_interested}.agency_id`, `${TABLES.agencies}.name`, `${TABLES.agencies}.abbreviation`);
    return rows;
}

async function getTotalGrantsBetweenDates(from, to) {
    const rows = await knex(TABLES.grants)
        .where('created_at', '>=', new Date(from))
        .where('created_at', '<=', new Date(to))
        .count();
    return rows[0].count;
}

function markGrantAsViewed({ grantId, agencyId, userId }) {
    return knex(TABLES.grants_viewed)
        .insert({ agency_id: agencyId, grant_id: grantId, user_id: userId });
}
function getInterestedAgencies({ grantIds }) {
    return knex(TABLES.agencies)
        .join(TABLES.grants_interested, `${TABLES.agencies}.id`, '=', `${TABLES.grants_interested}.agency_id`)
        .join(TABLES.users, `${TABLES.users}.id`, '=', `${TABLES.grants_interested}.user_id`)
        .leftJoin(TABLES.interested_codes, `${TABLES.interested_codes}.id`, '=', `${TABLES.grants_interested}.interested_code_id`)
        .whereIn('grant_id', grantIds)
        .select(`${TABLES.grants_interested}.grant_id`, `${TABLES.grants_interested}.agency_id`,
            `${TABLES.agencies}.name as agency_name`, `${TABLES.agencies}.abbreviation as agency_abbreviation`,
            `${TABLES.users}.id as user_id`, `${TABLES.users}.email as user_email`, `${TABLES.users}.name as user_name`,
            `${TABLES.interested_codes}.id as interested_code_id`, `${TABLES.interested_codes}.name as interested_code_name`);
}

function markGrantAsInterested({
    grantId, agencyId, userId, interestedCode,
}) {
    return knex(TABLES.grants_interested)
        .insert({
            agency_id: agencyId,
            grant_id: grantId,
            user_id: userId,
            interested_code_id: interestedCode,
        });
}

function getInterestedCodes() {
    return knex(TABLES.interested_codes)
        .select('*')
        .orderBy('name');
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
    getTotalGrants,
    getTotalViewedGrants,
    getTotalInteresedGrants,
    getTotalGrantsBetweenDates,
    getTotalInterestedGrantsByAgencies,
    markGrantAsViewed,
    getInterestedAgencies,
    getInterestedCodes,
    markGrantAsInterested,
    getElegibilityCodes,
    sync,
    getAllRows,
    close,
};
