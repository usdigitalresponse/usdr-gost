/* eslint-disable no-use-before-define */
/* eslint-disable no-await-in-loop */
/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */
let v4;
try {
    // eslint-disable-next-line global-require
    const crypto = require('crypto');
    v4 = crypto.randomUUID;
    if (!v4) {
        // node v12 doesnt have randomUUID
        throw new Error();
    }
} catch (err) {
    console.log('Node lacks crypto support!');
    // eslint-disable-next-line global-require
    ({ v4 } = require('uuid'));
}

const knex = require('./connection');
const { TABLES } = require('./constants');
const helpers = require('./helpers');

async function getUsers(rootAgencyId) {
    const subAgencies = await getAgencies(rootAgencyId);

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
        .leftJoin('agencies', 'agencies.id', 'users.agency_id')
        .whereIn('agencies.id', subAgencies.map((subAgency) => subAgency.id));
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

async function deleteUser(id) {
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
            'users.name',
            'users.role_id',
            'roles.name as role_name',
            'roles.rules as role_rules',
            'users.agency_id',
            'agencies.name as agency_name',
            'agencies.abbreviation as agency_abbreviation',
            'agencies.parent as agency_parent_id_id',
            'agencies.warning_threshold as agency_warning_threshold',
            'agencies.danger_threshold as agency_danger_threshold',
            'users.tags',
        )
        .leftJoin('roles', 'roles.id', 'users.role_id')
        .leftJoin('agencies', 'agencies.id', 'users.agency_id')
        .where('users.id', id);
    if (user.role_id != null) {
        user.role = {
            id: user.role_id,
            name: user.role_name,
            rules: user.role_rules,
        };
    }
    if (user.agency_id != null) {
        user.agency = {
            id: user.agency_id,
            name: user.agency_name,
            abbreviation: user.agency_abbreviation,
            agency_parent_id: user.agency_parent_id,
            warning_threshold: user.agency_warning_threshold,
            danger_threshold: user.agency_danger_threshold,
        };
        let subagencies = [];
        if (user.role.name === 'admin') {
            subagencies = await getAgencies(user.agency_id);
        } else {
            subagencies.push({ ...user.agency });
        }
        user.agency.subagencies = subagencies;
    }
    return user;
}

async function getAgencyCriteriaForAgency(agencyId) {
    const eligibilityCodes = await getAgencyEligibilityCodes(agencyId);
    const enabledECodes = eligibilityCodes.filter((e) => e.enabled);
    const keywords = await getAgencyKeywords(agencyId);

    return {
        eligibilityCodes: enabledECodes.map((c) => c.code),
        keywords: keywords.map((c) => c.search_term),
    };
}

/*  isSubOrganization(parent, candidateChild) returns true if
    candidateChild is a child of parent.
    Normally parent will be the agency_id of the logged in user, and
    candidateChild will be the agency_id in the request header.
*/
async function isSubOrganization(parent, candidateChild) {
    const query = `
    with recursive hierarchy as (
      select id, parent from agencies
      where id = ?
      union all
      select agencies.id, agencies.parent from agencies
      inner join hierarchy
      on agencies.id = hierarchy.parent
    )
    select id from hierarchy;
    `;

    const result = await knex.raw(query, candidateChild);
    // console.dir(result.rows.map((rec) => rec.id));
    return result.rows.map((rec) => rec.id).indexOf(parent) !== -1;
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

async function incrementAccessTokenUses(passcode) {
    const result = await knex('access_tokens')
        .update({ uses: knex.raw('uses + 1') })
        .where('passcode', passcode)
        .then(() => knex('access_tokens')
            .select('uses')
            .where('passcode', passcode));
    return result[0].uses;
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
        .insert({
            agency_id: agencyId,
            code,
            enabled,
            updated_at: new Date(),
        })
        .onConflict(['agency_id', 'code'])
        .merge();
}

async function getKeyword(keywordId) {
    const response = await knex(TABLES.keywords)
        .select('*')
        .where('id', keywordId);
    return response[0];
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
    currentPage, perPage, agencies, filters, orderBy, searchTerm,
} = {}) {
    const { data, pagination } = await knex(TABLES.grants)
        .select(`${TABLES.grants}.*`)
        .modify((queryBuilder) => {
            if (searchTerm && searchTerm !== 'null') {
                queryBuilder.andWhere(
                    (qb) => qb.where(`${TABLES.grants}.grant_id`, '~*', searchTerm)
                        .orWhere(`${TABLES.grants}.grant_number`, '~*', searchTerm)
                        .orWhere(`${TABLES.grants}.title`, '~*', searchTerm),
                );
            }
            if (filters) {
                if (filters.interestedByUser) {
                    queryBuilder.join(TABLES.grants_interested, `${TABLES.grants}.grant_id`, `${TABLES.grants_interested}.grant_id`);
                }
                if (filters.assignedToAgency) {
                    queryBuilder.join(TABLES.assigned_grants_agency, `${TABLES.grants}.grant_id`, `${TABLES.assigned_grants_agency}.grant_id`);
                }
                queryBuilder.andWhere(
                    (qb) => {
                        helpers.whereAgencyCriteriaMatch(qb, filters.agencyCriteria);

                        if (filters.interestedByUser) {
                            qb.where(`${TABLES.grants_interested}.user_id`, '=', filters.interestedByUser);
                        }
                        if (filters.assignedToAgency) {
                            qb.where(`${TABLES.assigned_grants_agency}.agency_id`, '=', filters.assignedToAgency);
                        }
                    },
                );
            }

            if (orderBy && orderBy !== 'undefined') {
                if (orderBy.includes('interested_agencies')) {
                    queryBuilder.leftJoin(TABLES.grants_interested, `${TABLES.grants}.grant_id`, `${TABLES.grants_interested}.grant_id`);
                    const orderArgs = orderBy.split('|');
                    queryBuilder.orderBy(`${TABLES.grants_interested}.grant_id`, orderArgs[1]);
                    queryBuilder.orderBy(`${TABLES.grants}.grant_id`, orderArgs[1]);
                } else if (orderBy.includes('viewed_by')) {
                    const orderArgs = orderBy.split('|');
                    queryBuilder.leftJoin(TABLES.grants_viewed, `${TABLES.grants}.grant_id`, `${TABLES.grants_viewed}.grant_id`);
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
        .andWhere(`${TABLES.agencies}.id`, 'IN', agencies)
        .select(`${TABLES.grants_viewed}.grant_id`, `${TABLES.grants_viewed}.agency_id`, `${TABLES.agencies}.name as agency_name`, `${TABLES.agencies}.abbreviation as agency_abbreviation`);

    const interestedBy = await getInterestedAgencies({ grantIds: data.map((grant) => grant.grant_id), agencies });

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

async function getGrant({ grantId }) {
    const results = await knex.table(TABLES.grants)
        .select('*')
        .where({ grant_id: grantId });
    return results[0];
}

async function getTotalGrants({ agencyCriteria, createdTsBounds, updatedTsBounds } = {}) {
    const rows = await knex(TABLES.grants)
        .modify(helpers.whereAgencyCriteriaMatch, agencyCriteria)
        .modify((qb) => {
            if (createdTsBounds && createdTsBounds.fromTs) {
                qb.where('created_at', '>=', createdTsBounds.fromTs);
            }
            if (updatedTsBounds && updatedTsBounds.fromTs) {
                qb.where('updated_at', '>=', updatedTsBounds.fromTs);
            }
        })
        .count();
    return rows[0].count;
}

async function getTotalViewedGrants() {
    const rows = await knex(TABLES.grants_viewed).count();
    return rows[0].count;
}

async function getTotalInterestedGrants() {
    const rows = await knex(TABLES.grants_interested).count();
    return rows[0].count;
}

async function getTotalInterestedGrantsByAgencies() {
    const rows = await knex(TABLES.grants_interested)
        .select(`${TABLES.grants_interested}.agency_id`, `${TABLES.agencies}.name`, `${TABLES.agencies}.abbreviation`,
            knex.raw('SUM(CASE WHEN is_rejection = TRUE THEN 1 ELSE 0 END) rejections'),
            knex.raw('SUM(CASE WHEN is_rejection = FALSE THEN 1 ELSE 0 END) interested'))
        .join(TABLES.agencies, `${TABLES.grants_interested}.agency_id`, `${TABLES.agencies}.id`)
        .join(TABLES.interested_codes, `${TABLES.grants_interested}.interested_code_id`, `${TABLES.interested_codes}.id`)
        .count(`${TABLES.interested_codes}.is_rejection`)
        .groupBy(`${TABLES.grants_interested}.agency_id`, `${TABLES.agencies}.name`, `${TABLES.agencies}.abbreviation`);
    return rows;
}

function markGrantAsViewed({ grantId, agencyId, userId }) {
    return knex(TABLES.grants_viewed)
        .insert({ agency_id: agencyId, grant_id: grantId, user_id: userId });
}

function getGrantAssignedAgencies({ grantId, agencies }) {
    return knex(TABLES.assigned_grants_agency)
        .join(TABLES.agencies, `${TABLES.agencies}.id`, '=', `${TABLES.assigned_grants_agency}.agency_id`)
        .where({ grant_id: grantId })
        .andWhere('agency_id', 'IN', agencies);
}

function assignGrantsToAgencies({ grantId, agencyIds, userId }) {
    const insertPayload = agencyIds.map((aId) => ({
        agency_id: aId,
        grant_id: grantId,
        assigned_by: userId,
    }));
    return knex(TABLES.assigned_grants_agency)
        .insert(insertPayload)
        .onConflict(['agency_id', 'grant_id'])
        .ignore();
}

function unassignAgenciesToGrant({ grantId, agencyIds }) {
    const deleteWhere = agencyIds.map((aId) => ([aId, grantId]));
    return knex(TABLES.assigned_grants_agency)
        .whereIn(['agency_id', 'grant_id'], deleteWhere)
        .delete();
}

function getInterestedAgencies({ grantIds, agencies }) {
    return knex(TABLES.agencies)
        .join(TABLES.grants_interested, `${TABLES.agencies}.id`, '=', `${TABLES.grants_interested}.agency_id`)
        .join(TABLES.users, `${TABLES.users}.id`, '=', `${TABLES.grants_interested}.user_id`)
        .leftJoin(TABLES.interested_codes, `${TABLES.interested_codes}.id`, '=', `${TABLES.grants_interested}.interested_code_id`)
        .whereIn('grant_id', grantIds)
        .andWhere(`${TABLES.agencies}.id`, 'IN', agencies)
        .select(`${TABLES.grants_interested}.grant_id`, `${TABLES.grants_interested}.agency_id`,
            `${TABLES.agencies}.name as agency_name`, `${TABLES.agencies}.abbreviation as agency_abbreviation`,
            `${TABLES.users}.id as user_id`, `${TABLES.users}.email as user_email`, `${TABLES.users}.name as user_name`,
            `${TABLES.interested_codes}.id as interested_code_id`, `${TABLES.interested_codes}.name as interested_code_name`, `${TABLES.interested_codes}.is_rejection as interested_is_rejection`);
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

async function getAgency(agencyId) {
    const query = `SELECT id, name, abbreviation, parent, warning_threshold, danger_threshold 
    FROM agencies WHERE id = ?;`;
    const result = await knex.raw(query, agencyId);

    return result.rows;
}

async function getAgencies(rootAgency) {
    const query = `WITH RECURSIVE subagencies AS (
    SELECT id, name, abbreviation, parent, warning_threshold, danger_threshold 
    FROM agencies WHERE id = ?
    UNION
        SELECT a.id, a.name, a.abbreviation, a.parent, a.warning_threshold, a.danger_threshold 
        FROM agencies a INNER JOIN subagencies s ON s.id = a.parent
    ) SELECT * FROM subagencies ORDER BY name; `;
    const result = await knex.raw(query, rootAgency);

    return result.rows;
}

async function getAgencyEligibilityCodes(agencyId) {
    const eligibilityCodes = await knex(TABLES.eligibility_codes).orderBy('code');
    const agencyEligibilityCodes = await knex(TABLES.agency_eligibility_codes)
        .where('agency_eligibility_codes.agency_id', agencyId)
        .orderBy('code');
    return eligibilityCodes.map((ec) => {
        const agencyEcEnabled = agencyEligibilityCodes.find((aEc) => ec.code === aEc.code);
        if (!agencyEcEnabled) {
            return {
                ...ec,
                created_at: null,
                updated_at: null,
                enabled: false,
            };
        }
        return {
            ...ec,
            ...agencyEcEnabled,
        };
    });
}

function getAgencyKeywords(agencyId) {
    return knex(TABLES.keywords)
        .select('*')
        .where('agency_id', agencyId);
}

async function createAgency({
    name, abbreviation, parent, warning_threshold, danger_threshold,
}) {
    // seeded agencies with hardcoded ids will make autoicrement fail since it doesnt
    // know which is the next id
    await knex.raw('select setval(\'agencies_id_seq\', max(id)) from agencies');
    return knex(TABLES.agencies)
        .insert({
            parent,
            name,
            abbreviation,
            warning_threshold,
            danger_threshold,
        });
}

function setAgencyThresholds(id, warning_threshold, danger_threshold) {
    return knex(TABLES.agencies)
        .where({
            id,
        })
        .update({ warning_threshold, danger_threshold });
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
                console.error(`knex error when creating a new row with key ${newRow[syncKey]}`);
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
    getAgencyCriteriaForAgency,
    isSubOrganization,
    getRoles,
    createAccessToken,
    getAccessToken,
    incrementAccessTokenUses,
    markAccessTokenUsed,
    getAgency,
    getAgencies,
    getAgencyEligibilityCodes,
    setAgencyEligibilityCodeEnabled,
    getKeyword,
    getKeywords,
    getAgencyKeywords,
    setAgencyThresholds,
    createKeyword,
    deleteKeyword,
    getGrants,
    getGrant,
    getTotalGrants,
    getTotalViewedGrants,
    getTotalInterestedGrants,
    getTotalInterestedGrantsByAgencies,
    markGrantAsViewed,
    getInterestedAgencies,
    getInterestedCodes,
    markGrantAsInterested,
    getGrantAssignedAgencies,
    assignGrantsToAgencies,
    createAgency,
    unassignAgenciesToGrant,
    getElegibilityCodes,
    sync,
    getAllRows,
    close,
};
