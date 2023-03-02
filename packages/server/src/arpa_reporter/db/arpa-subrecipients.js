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

async function createRecipient(recipient, trns = knex) {
    const tenantId = useTenantId();
    if (!(recipient.uei || recipient.tin)) {
        throw new Error('recipient row must include a `uei` or a `tin` field');
    }

    return trns('arpa_subrecipients')
        .insert({ ...recipient, tenant_id: tenantId })
        .returning('*')
        .then((rows) => rows[0]);
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

async function findRecipient(uei = null, tin = null, trns = knex) {
    const tenantId = useTenantId();
    const query = baseQuery(trns).where('arpa_subrecipients.tenant_id', tenantId);

    if (uei) {
        query.where('arpa_subrecipients.uei', uei);
    } else if (tin) {
        query.where('arpa_subrecipients.tin', tin);
    } else {
        return null;
    }

    return query.then((rows) => rows[0]);
}

async function listRecipients(trns = knex) {
    const tenantId = useTenantId();
    return baseQuery(trns).where('arpa_subrecipients.tenant_id', tenantId);
}

async function listRecipientsForReportingPeriod(periodId, trns = knex) {
    return baseQuery(trns).where('reporting_period_id', periodId);
}

module.exports = {
    createRecipient,
    getRecipient,
    findRecipient,
    updateRecipient,
    listRecipients,
    listRecipientsForReportingPeriod,
};

// NOTE: This file was copied from src/server/db/arpa-subrecipients.js (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z
