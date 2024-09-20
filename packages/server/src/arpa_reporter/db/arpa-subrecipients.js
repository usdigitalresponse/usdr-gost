const knex = require('../../db/connection');
const { useTenantId } = require('../use-request');

function baseQuery(trns) {
    return trns('arpa_subrecipients')
        .select(
            'arpa_subrecipients.*',
            'uploads.reporting_period_id AS reporting_period_id',
            'users.email AS created_by',
            'users2.email AS updated_by_email',
        )
        .leftJoin('uploads', 'arpa_subrecipients.upload_id', 'uploads.id')
        .leftJoin('users', 'uploads.user_id', 'users.id')
        .leftJoin('users AS users2', 'arpa_subrecipients.updated_by', 'users2.id');
}

/**
 * Archive or restore a subrecipient.
 *
 * Call t his method to archive or restore an arpa_subrecipients table.
 */
async function archiveOrRestoreRecipient(id, { updatedByUser }, trns = knex) {
    const query = trns('arpa_subrecipients')
        .where('id', id)
        .returning('*');

    if (updatedByUser) {
        query.update('updated_by', updatedByUser.id);
        query.update('updated_at', knex.fn.now());
    }

    query.update(
        'archived_at',
        knex.raw('CASE WHEN archived_at IS NULL THEN ?? ELSE NULL END', [knex.fn.now()]),
    );

    return query.then((rows) => rows[0]);
}

async function updateRecipient(id, { updatedByUser, record }, trns = knex) {
    const query = trns('arpa_subrecipients')
        .where('id', id)
        .returning('*');

    if (record) {
        query.update('record', record);
    }

    if (updatedByUser) {
        query.update('updated_by', updatedByUser.id);
        query.update('updated_at', knex.fn.now());
    }

    return query.then((rows) => rows[0]);
}

async function getRecipient(id, trns = knex) {
    return baseQuery(trns)
        .where('arpa_subrecipients.id', id)
        .then((rows) => rows[0]);
}

const SUPPORTED_QUERY_FIELD_TYPES = {
    UEI: 'uei',
    TIN: 'tin',
    NAME: 'name',
};

/**
 *
 * @param { SUPPORTED_QUERY_FIELDS_TYPES } fieldType - the field type to search for
 * @param { string } value - the value to search for
 * @param { * } trns - knex transaction
 * @return {Promise<Subrecipient>} The subrecipient object
 */
async function findRecipient(fieldType = null, value = null, trns = knex) {
    const tenantId = useTenantId();
    const query = baseQuery(trns).where('arpa_subrecipients.tenant_id', tenantId);

    if (fieldType === 'uei') {
        query.where('arpa_subrecipients.uei', value);
    } else if (fieldType === 'tin') {
        query.where('arpa_subrecipients.tin', value);
    } else if (fieldType === 'name') {
        query.where('arpa_subrecipients.name', value);
    } else {
        throw new Error('Cannot query for recipient without a valid field type');
    }

    return query.then((rows) => rows[0]);
}

async function createRecipient(recipient, trns = knex) {
    const tenantId = useTenantId();

    let result;
    try {
        result = await trns('arpa_subrecipients')
            .insert({ ...recipient, tenant_id: tenantId })
            .returning('*')
            .then((rows) => rows[0]);
    } catch (error) {
        switch (error.constraint) {
            case 'chk_at_least_one_of_uei_tin_name_not_null':
                throw new Error('recipient row must include a `uei`, `tin`, or `name` field');
            case 'idx_arpa_subrecipients_tenant_id_uei_unique':
                throw new Error('A recipient with this UEI already exists');
            case 'idx_arpa_subrecipients_tenant_id_tin_unique':
                throw new Error('A recipient with this TIN already exists');
            case 'idx_arpa_subrecipients_tenant_id_name_unique':
                throw new Error('A recipient with this name already exists');
            default:
                throw error;
        }
    }

    return result;
}

async function listRecipients(trns = knex) {
    const tenantId = useTenantId();
    return baseQuery(trns).where('arpa_subrecipients.tenant_id', tenantId);
}

async function listRecipientsForReportingPeriod(periodId, trns = knex) {
    return baseQuery(trns).where('reporting_period_id', periodId).whereNull('archived_at');
}

module.exports = {
    archiveOrRestoreRecipient,
    createRecipient,
    getRecipient,
    findRecipient,
    updateRecipient,
    listRecipients,
    listRecipientsForReportingPeriod,
    SUPPORTED_QUERY_FIELD_TYPES,
};

// NOTE: This file was copied from src/server/db/arpa-subrecipients.js (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z
