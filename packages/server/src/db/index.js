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

async function getUsers(tenantId) {
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
        .where('users.tenant_id', tenantId);

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

async function getUsersEmailAndName(ids) {
    return knex.select('id', 'name', 'email').from('users').whereIn('id', ids);
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
            'agencies.main_agency_id as agency_main_agency_id',
            'agencies.warning_threshold as agency_warning_threshold',
            'agencies.danger_threshold as agency_danger_threshold',
            'tenants.id as tenant_id',
            'tenants.display_name as tenant_display_name',
            'tenants.main_agency_id as tenant_main_agency_id',
            'tenants.uses_spoc_process as tenant_uses_spoc_process',
            'users.tags',
            'users.tenant_id',
        )
        .leftJoin('roles', 'roles.id', 'users.role_id')
        .leftJoin('agencies', 'agencies.id', 'users.agency_id')
        .leftJoin('tenants', 'tenants.main_agency_id', 'agencies.main_agency_id')
        .where('users.id', id);

    if (!user) return null;

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
            main_agency_id: user.agency_main_agency_id,
        };
        user.tenant = {
            id: user.tenant_id,
            display_name: user.tenant_display_name,
            main_agency_id: user.tenant_main_agency_id,
            uses_spoc_process: user.tenant_uses_spoc_process,
        };
        let subagencies = [];
        if (user.role.name === 'admin') {
            subagencies = await getAgencyTree(user.agency_id);
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

function getEligibilityCodes() {
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
    currentPage, perPage, tenantId, filters, orderBy, searchTerm, orderDesc,
} = {}) {
    const { data, pagination } = await knex(TABLES.grants)
        .select(`${TABLES.grants}.*`)
        .distinct()
        .modify((queryBuilder) => {
            if (searchTerm && searchTerm !== 'null') {
                queryBuilder.andWhere(
                    (qb) => qb.where(`${TABLES.grants}.grant_id`, '~*', searchTerm)
                        .orWhere(`${TABLES.grants}.grant_number`, '~*', searchTerm)
                        .orWhere(`${TABLES.grants}.title`, '~*', searchTerm),
                );
            }
            if (filters) {
                if (filters.interestedByUser || filters.positiveInterest || filters.result || filters.rejected || filters.interestedByAgency) {
                    queryBuilder.join(TABLES.grants_interested, `${TABLES.grants}.grant_id`, `${TABLES.grants_interested}.grant_id`)
                        .join(TABLES.interested_codes, `${TABLES.interested_codes}.id`, `${TABLES.grants_interested}.interested_code_id`);
                }
                if (filters.assignedToAgency) {
                    queryBuilder.join(TABLES.assigned_grants_agency, `${TABLES.grants}.grant_id`, `${TABLES.assigned_grants_agency}.grant_id`);
                }
                queryBuilder.andWhere(
                    (qb) => {
                        const isMyGrantsQuery = filters.interestedByAgency !== null
                                                || filters.assignedToAgency !== null
                                                || filters.rejected !== null
                                                || filters.result !== null;
                        if (!isMyGrantsQuery) {
                            helpers.whereAgencyCriteriaMatch(qb, filters.agencyCriteria);
                        }

                        if (filters.interestedByAgency != null) {
                            qb.where('grants_interested.agency_id', filters.interestedByAgency);
                        }
                        if (filters.interestedByUser) {
                            qb.where(`${TABLES.grants_interested}.user_id`, '=', filters.interestedByUser);
                        }
                        if (filters.assignedToAgency) {
                            qb.where(`${TABLES.assigned_grants_agency}.agency_id`, '=', filters.assignedToAgency);
                        }
                        if (!(filters.positiveInterest && filters.result && filters.rejected)) {
                            if (filters.positiveInterest) {
                                qb.where(`${TABLES.interested_codes}.status_code`, '=', 'Interested');
                            }
                            if (filters.result) {
                                qb.where(`${TABLES.interested_codes}.status_code`, '=', 'Result');
                            }
                            if (filters.rejected) {
                                qb.where(`${TABLES.interested_codes}.status_code`, '=', 'Rejected');
                            }
                        }
                        if (filters.opportunityStatuses?.length) {
                            qb.whereIn(`${TABLES.grants}.opportunity_status`, filters.opportunityStatuses);
                        }
                        if (filters.opportunityCategories?.length) {
                            qb.whereIn(`${TABLES.grants}.opportunity_category`, filters.opportunityCategories);
                        }
                        if (filters.costSharing) {
                            qb.where(`${TABLES.grants}.cost_sharing`, '=', filters.costSharing);
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
                    const orderDirection = ((orderDesc === 'true') ? 'desc' : 'asc');
                    if (orderArgs.length > 1) {
                        console.log(`Too many orderArgs: ${orderArgs}`);
                    }
                    queryBuilder.orderBy(orderArgs[0], orderDirection);
                }
            }
        })
        .paginate({ currentPage, perPage, isLengthAware: true });

    const viewedByQuery = knex(TABLES.agencies)
        .join(TABLES.grants_viewed, `${TABLES.agencies}.id`, '=', `${TABLES.grants_viewed}.agency_id`)
        .whereIn('grant_id', data.map((grant) => grant.grant_id))
        .andWhere('agencies.tenant_id', tenantId);

    const viewedBy = await viewedByQuery.select(`${TABLES.grants_viewed}.grant_id`, `${TABLES.grants_viewed}.agency_id`, `${TABLES.agencies}.name as agency_name`, `${TABLES.agencies}.abbreviation as agency_abbreviation`);
    const interestedBy = await getInterestedAgencies({ grantIds: data.map((grant) => grant.grant_id), tenantId });

    const dataWithAgency = data.map((grant) => {
        const viewedByAgencies = viewedBy.filter((viewed) => viewed.grant_id === grant.grant_id);
        const agenciesInterested = interestedBy.filter((interested) => interested.grant_id === grant.grant_id);
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

async function getSingleGrantDetails({ grantId, tenantId }) {
    const results = await knex.table(TABLES.grants)
        .select('*')
        .where({ grant_id: grantId });

    const viewedBy = await knex(TABLES.agencies)
        .join(TABLES.grants_viewed, `${TABLES.agencies}.id`, '=', `${TABLES.grants_viewed}.agency_id`)
        .whereIn('grant_id', [grantId])
        .andWhere('tenant_id', tenantId)
        .select(`${TABLES.grants_viewed}.grant_id`, `${TABLES.grants_viewed}.agency_id`, `${TABLES.agencies}.name as agency_name`, `${TABLES.agencies}.abbreviation as agency_abbreviation`);

    const interestedBy = await getInterestedAgencies({ grantIds: [grantId], tenantId });

    const viewedByAgencies = viewedBy.filter((viewed) => viewed.grant_id === grantId);
    const agenciesInterested = interestedBy.filter((interested) => interested.grant_id === grantId);

    return {
        ...(results[0]),
        viewed_by_agencies: viewedByAgencies,
        interested_agencies: agenciesInterested,
    };
}

async function getClosestGrants({
    agency, perPage, currentPage, timestampForTest,
}) {
    const agencies = await getAgencyTree(agency);

    // updated to no longer limit result # & specify user association
    const timestamp = (timestampForTest || new Date()).toLocaleDateString('en-US');
    return knex(TABLES.grants_interested)
        .select('grants.title', 'grants.close_date', 'grants.grant_id')
        .join('grants', 'grants.grant_id', 'grants_interested.grant_id')
        .whereIn('grants_interested.agency_id', agencies.map((a) => a.id))
        .andWhere('close_date', '>=', timestamp)
        .orderBy('close_date', 'asc')
        .paginate({ currentPage, perPage, isLengthAware: true });
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

async function getTotalInterestedGrantsByAgencies(agencyId) {
    const agencies = await getAgencyTree(agencyId);
    const rows = await knex(TABLES.grants_interested)
        .select(`${TABLES.grants_interested}.agency_id`, `${TABLES.agencies}.name`, `${TABLES.agencies}.abbreviation`,
            knex.raw(`SUM(CASE WHEN status_code = 'Rejected' THEN 1 ELSE 0 END) rejections`),
            knex.raw(`SUM(CASE WHEN status_code = 'Interested' THEN 1 ELSE 0 END) interested`),
            knex.raw('SUM(award_ceiling::numeric) total_grant_money'),
            knex.raw(`SUM(CASE WHEN status_code = 'Rejected' THEN award_ceiling::numeric ELSE 0 END) total_interested_grant_money`),
            knex.raw(`SUM(CASE WHEN status_code = 'Interested' THEN award_ceiling::numeric ELSE 0 END) total_rejected_grant_money`))
        .join(TABLES.agencies, `${TABLES.grants_interested}.agency_id`, `${TABLES.agencies}.id`)
        .join(TABLES.interested_codes, `${TABLES.grants_interested}.interested_code_id`, `${TABLES.interested_codes}.id`)
        .join(TABLES.grants, `${TABLES.grants_interested}.grant_id`, `${TABLES.grants}.grant_id`)
        .count(`${TABLES.interested_codes}.status_code`)
        .whereIn('agencies.id', agencies.map((a) => a.id))
        .groupBy(`${TABLES.grants_interested}.agency_id`, `${TABLES.agencies}.name`, `${TABLES.agencies}.abbreviation`);
    return rows;
}

async function markGrantAsViewed({ grantId, agencyId, userId }) {
    const result = await knex(TABLES.grants_viewed)
        .insert({ agency_id: agencyId, grant_id: grantId, user_id: userId });
    return result;
}

function getGrantAssignedAgencies({ grantId, tenantId }) {
    return knex(TABLES.assigned_grants_agency)
        .join(TABLES.agencies, `${TABLES.agencies}.id`, '=', `${TABLES.assigned_grants_agency}.agency_id`)
        .where({ grant_id: grantId })
        .andWhere('tenant_id', tenantId);
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

async function getInterestedAgencies({ grantIds, tenantId }) {
    const query = knex(TABLES.agencies)
        .join(TABLES.grants_interested, `${TABLES.agencies}.id`, '=', `${TABLES.grants_interested}.agency_id`)
        .join(TABLES.users, `${TABLES.users}.id`, '=', `${TABLES.grants_interested}.user_id`)
        .leftJoin(TABLES.interested_codes, `${TABLES.interested_codes}.id`, '=', `${TABLES.grants_interested}.interested_code_id`)
        .whereIn('grant_id', grantIds)
        .andWhere('agencies.tenant_id', tenantId);

    const result = await query.select(`${TABLES.grants_interested}.grant_id`, `${TABLES.grants_interested}.agency_id`,
        `${TABLES.agencies}.name as agency_name`, `${TABLES.agencies}.abbreviation as agency_abbreviation`,
        `${TABLES.users}.id as user_id`, `${TABLES.users}.email as user_email`, `${TABLES.users}.name as user_name`,
        `${TABLES.interested_codes}.id as interested_code_id`, `${TABLES.interested_codes}.name as interested_code_name`, `${TABLES.interested_codes}.status_code as interested_status_code`);

    return result;
}

async function markGrantAsInterested({
    grantId, agencyId, userId, interestedCode,
}) {
    const results = await knex(TABLES.grants_interested)
        .insert({
            agency_id: agencyId,
            grant_id: grantId,
            user_id: userId,
            interested_code_id: +interestedCode,
        });
    return results;
}

async function getGrantsInterested({ agencyId, perPage, currentPage }) {
    const agencies = await getAgencyTree(agencyId);
    return knex('grants_interested')
        .select(knex.raw(`grants_interested.created_at,
                          agencies.name,
                          interested_codes.status_code,
                          grants_interested.agency_id,
                          grants.title,
                          grants.grant_id,
                          NULL AS assigned_by`))
        .innerJoin('agencies', 'agencies.id', 'grants_interested.agency_id')
        .innerJoin('interested_codes', 'interested_codes.id', 'grants_interested.interested_code_id')
        .innerJoin('grants', 'grants.grant_id', 'grants_interested.grant_id')
        .whereIn('agencies.id', agencies.map((subAgency) => subAgency.id))
        .unionAll((qb) => {
            qb.select(knex.raw(`assigned_grants_agency.created_at,
                                agencies.name,
                                NULL AS status_code,
                                assigned_grants_agency.agency_id,
                                grants.title,
                                grants.grant_id,
                                assigned_grants_agency.assigned_by`))
                .from('assigned_grants_agency')
                .innerJoin('agencies', 'agencies.id', 'assigned_grants_agency.agency_id')
                .innerJoin('grants', 'grants.grant_id', 'assigned_grants_agency.grant_id')
                .whereIn('agencies.id', agencies.map((subAgency) => subAgency.id));
        })
        .orderBy('created_at', 'DESC')
        .offset((currentPage - 1) * perPage)
        .limit(perPage);
}

async function getTotalInterestedGrants(agencyId) {
    const rows = await knex(TABLES.grants_interested)
        .whereNot('interested_code_id', null)
        .andWhere('agency_id', agencyId)
        .count();
    const rows2 = await knex(TABLES.assigned_grants_agency)
        .whereNot('assigned_by', null)
        .andWhere('agency_id', agencyId)
        .count();
    return +rows[0].count + +rows2[0].count;
}

async function unmarkGrantAsInterested({ grantId, agencyIds }) {
    const result = await knex(TABLES.grants_interested)
        .where({
            grant_id: grantId,
        })
        .andWhere('agency_id', 'IN', agencyIds)
        .del();
    return result;
}

function getInterestedCodes() {
    return knex(TABLES.interested_codes)
        .select('*')
        .orderBy('name');
}

async function getAgency(agencyId) {
    const result = await getAgenciesByIds([agencyId]);

    return result;
}

async function getAgenciesByIds(agencyIds) {
    const query = knex.select()
        .from(TABLES.agencies)
        .whereIn('agencies.id', agencyIds)
        .leftJoin('tenants', 'tenants.id', '=', `${TABLES.agencies}.tenant_id`);
    const result = await query;

    return result;
}

async function getTenantAgencies(tenantId) {
    return knex(TABLES.agencies)
        .select('*')
        .where('tenant_id', tenantId)
        .orderBy('name');
}

async function getAgencyTree(rootAgency) {
    const query = `WITH RECURSIVE subagencies AS (
    SELECT a.id, name, abbreviation, parent, warning_threshold, danger_threshold, tenant_id
    FROM agencies a
    JOIN tenants t ON a.tenant_id = t.id
    WHERE a.id = ?
    UNION
        SELECT a.id, a.name, a.abbreviation, a.parent, a.warning_threshold, a.danger_threshold, a.tenant_id
        FROM agencies a INNER JOIN subagencies s
            ON s.id = a.parent AND s.tenant_id = a.tenant_id
    ) SELECT * FROM subagencies ORDER BY name; `;
    const result = await knex.raw(query, rootAgency);

    return result.rows;
}

async function getTenant(tenantId) {
    return knex('tenants').select('*').where('id', tenantId).then((rows) => rows[0]);
}

async function getTenants() {
    return knex('tenants').select('*');
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
                enabled: true,
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

async function createAgency(agency, creatorId) {
    const update = { ...agency, creator_id: creatorId };
    // seeded agencies with hardcoded ids will make autoicrement fail since it doesnt
    // know which is the next id
    await knex.raw('select setval(\'agencies_id_seq\', max(id)) from agencies');

    // Enforce tenant isolation by using the tenant_id from the user
    // and the main_agency_id from the tenant.
    const result = await knex.raw(`
        WITH upd AS (
            SELECT
              :parent::integer,
              :name,
              :abbreviation,
              :warning_threshold::integer,
              :danger_threshold::integer,
              :code,
              u.tenant_id,
              t.main_agency_id
            FROM users u
            JOIN tenants t ON u.tenant_id = t.id
            WHERE u.id = :creator_id
        ) INSERT INTO agencies (
            parent,
            name,
            abbreviation,
            warning_threshold,
            danger_threshold,
            code,
            tenant_id,
            main_agency_id
        ) (SELECT * FROM upd) RETURNING *`, update);

    return result.rows[0];
}

async function deleteAgency(
    id, parent, name, abbreviation, warning_threshold, danger_threshold,
) {
    // seeded agencies with hardcoded ids will make autoicrement fail since it doesnt
    // know which is the next id
    await knex.raw('select setval(\'agencies_id_seq\', max(id)) from agencies');
    return knex(TABLES.agencies)
        .where({
            id,
            parent,
            name,
            abbreviation,
            warning_threshold,
            danger_threshold,
        })
        .del();
}

function setAgencyThresholds(id, warning_threshold, danger_threshold) {
    return knex(TABLES.agencies)
        .where({
            id,
        })
        .update({ warning_threshold, danger_threshold });
}

function setAgencyName(id, agen_name) {
    // console.log('agen name === ' + agen_name);
    return knex(TABLES.agencies)
        .where({
            id,
        })
        .update({ name: agen_name });
}

function setAgencyAbbr(id, agen_abbr) {
    return knex(TABLES.agencies)
        .where({
            id,
        })
        .update({ abbreviation: agen_abbr });
}

function setAgencyCode(id, agencyCode) {
    return knex(TABLES.agencies)
        .where({
            id,
        })
        .update({ code: agencyCode });
}

function setAgencyParent(id, agen_parent) {
    // console.log('agen id in index.js ' + id);
    return knex(TABLES.agencies)
        .where({
            id,
        })
        .update({ parent: agen_parent });
}

function setTenantDisplayName(id, display_name) {
    return knex(TABLES.tenants)
        .where({
            id,
        })
        .update({ display_name });
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
                    console.error(`knex error when updating ${oldRows[syncKeyValue][syncKey]} in ${tableName} with ${JSON.stringify(updatedFields)}: ${err}`);
                }
            }
        } else {
            // does not exist, insert!
            alreadyUpdated[syncKeyValue] = true;
            try {
                await createRecord(tableName, newRow);
                console.log(`created ${newRow[syncKey]} in ${tableName}`);
            } catch (err) {
                console.error(`knex error when creating a new row with key ${newRow[syncKey]} in ${tableName}: ${err}`);
            }
        }
    }
}

/**
 * Determines if all given agencies belong to the same given tenant
 * @param  int        tenantId
 * @parm   Array[int] agencyIds
 * @return boolean
 * */
async function inTenant(tenantId, agencyIds) {
    const uniqueAgencyIds = Array.from(new Set(agencyIds));

    const result = await knex(
        knex('agencies')
            .select('id as agency_id')
            .where('tenant_id', tenantId)
            .whereIn('id', uniqueAgencyIds)
            .as('agencies_in_tenant'),
    ).select(
        // Aggregate the results of the subquery into an array, and check that
        // all our expected agencyIds member values are contained by the aggregation.
        // Coalesce the result of the check so that it always returns boolean.
        knex.raw(
            'coalesce(? <@ array_agg(agencies_in_tenant.agency_id), false) as same_tenant',
            [uniqueAgencyIds],
        ),
    ).first();

    return result.same_tenant === true;
}

function close() {
    return knex.destroy();
}

module.exports = {
    knex,
    getUsers,
    createUser,
    deleteUser,
    getUsersEmailAndName,
    getUser,
    getAgencyCriteriaForAgency,
    isSubOrganization,
    getRoles,
    createAccessToken,
    getAccessToken,
    incrementAccessTokenUses,
    inTenant,
    markAccessTokenUsed,
    getAgency,
    getAgenciesByIds,
    getAgencyTree,
    getTenantAgencies,
    getTenant,
    getTenants,
    getAgencyEligibilityCodes,
    setAgencyEligibilityCodeEnabled,
    getKeyword,
    getKeywords,
    getAgencyKeywords,
    getGrantsInterested,
    setAgencyThresholds,
    setAgencyName,
    setAgencyAbbr,
    setAgencyCode,
    setAgencyParent,
    setTenantDisplayName,
    createKeyword,
    deleteKeyword,
    getGrants,
    getSingleGrantDetails,
    getClosestGrants,
    getGrant,
    getTotalGrants,
    getTotalViewedGrants,
    getTotalInterestedGrants,
    getTotalInterestedGrantsByAgencies,
    markGrantAsViewed,
    getInterestedAgencies,
    getInterestedCodes,
    markGrantAsInterested,
    unmarkGrantAsInterested,
    getGrantAssignedAgencies,
    assignGrantsToAgencies,
    createAgency,
    deleteAgency,
    unassignAgenciesToGrant,
    getEligibilityCodes,
    sync,
    getAllRows,
    close,
};
