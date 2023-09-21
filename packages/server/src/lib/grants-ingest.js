const { ReceiveMessageCommand, DeleteMessageCommand } = require('@aws-sdk/client-sqs');
const moment = require('moment');

/**
 * receiveNextMessageBatch long-polls an SQS queue for up to 10 messages.
 * @param { import('@aws-sdk/client-sqs').SQSClient } sqs AWS SDK client used to issue commands to the SQS API.
 * @param { string} queueUrl The URL identifying the queue to poll.
 * @returns { Array[import('@aws-sdk/client-sqs').Message] } Received messages, if any.
 */
async function receiveNextMessageBatch(sqs, queueUrl) {
    const resp = await sqs.send(new ReceiveMessageCommand({
        QueueUrl: queueUrl,
        WaitTimeSeconds: 20,
        MaxNumberOfMessages: 10,
    }));

    const messages = (resp && resp.Messages) ? resp.Messages : [];
    if (messages.length === 0) {
        console.log('Empty message batch received from SQS');
    }
    return messages;
}

function mapSourceDataToGrant(source) {
    const grant = {
        // Old defaults/placeholders:
        search_terms: '[in title/desc]+',
        status: 'inbox',
        notes: 'auto-inserted by script',
        reviewer_name: 'none',
        // Data from event:
        grant_id: source.opportunity.id,
        revision_id: source.revision.id,
        grant_number: source.opportunity.number,
        title: source.opportunity.title,
        description: source.opportunity.description,
        agency_code: source.agency ? source.agency.code : undefined,
        cost_sharing: source.cost_sharing_or_matching_requirement ? 'Yes' : 'No',
        opportunity_category: source.opportunity.category.name,
        cfda_list: (source.cfda_numbers || []).join(', '),
        eligibility_codes: (source.eligible_applicants || []).map((it) => it.code).join(' '),
        award_ceiling: source.award && source.award.ceiling ? source.award.ceiling : undefined,
        award_floor: source.award && source.award.floor ? source.award.floor : undefined,
        raw_body: JSON.stringify(source),
        bill: source.bill,
        funding_instrument_codes: (source.funding_instrument_types || []).map((it) => it.code).join(' '),
    };

    const { milestones } = source.opportunity;
    grant.open_date = milestones.post_date;
    grant.close_date = milestones.close && milestones.close.date
        ? milestones.close.date : '2100-01-01';
    grant.archive_date = milestones.archive_date;
    const today = moment().startOf('day');
    if (milestones.archive_date && today.isSameOrAfter(moment(milestones.archive_date), 'date')) {
        grant.opportunity_status = 'archived';
    } else if (today.isSameOrAfter(moment(grant.close_date), 'date')) {
        grant.opportunity_status = 'closed';
    } else {
        grant.opportunity_status = 'posted';
    }

    return grant;
}
/**
 * Inserts a grant record into the database, or updates an exist record with the same grant_id value.
 *
 * So as to prevent writes from events received out-of-order, updates will only occur when
 * the revision_id value of the incoming grant object is greater than that of the extant
 * database record, or when the .
 *
 * @param { import('knex').Knex } knex Database client for persisting grants.
 * @param { object } grant The Grant object to persist
 */
async function upsertGrant(knex, grant) {
    await knex('grants')
        .insert(grant)
        .onConflict('grant_id')
        .merge({ ...grant, ...{ updated_at: 'now' } })
        .where('grants.revision_id', '<', grant.revision_id)
        .orWhereNull('grants.revision_id')
        .returning('grant_id');
}

async function deleteMessage(sqs, queueUrl, receiptHandle) {
    const command = new DeleteMessageCommand({
        QueueUrl: queueUrl,
        ReceiptHandle: receiptHandle,
    });
    await sqs.send(command);
}

/**
 * processMessages Saves a batch of SQS messages containing JSON grant data sent
 * from the grants-ingest service to the database. Existing database records that match
 * a message's grant identifier are updated. After each message is processed, it is
 * deleted from the SQS queue.
 *
 * Any errors related to parsing or saving are logged and do not prevent further processing.
 * Errors interacting with SQS are fatal.
 *
 * @param { import('knex').Knex } knex Database client for persisting grants.
 * @param { import('@aws-sdk/client-sqs').SQSClient } sqs AWS SDK client used to issue commands to the SQS API.
 * @param { string } queueUrl The URL identifying the queue to poll.
 * @param { Array[import('@aws-sdk/client-sqs').Message] } messages Messages to process from SQS.
 */
async function processMessages(knex, sqs, queueUrl, messages) {
    let grantParseErrorCount = 0;
    let grantSaveSuccessCount = 0;
    let grantSaveErrorCount = 0;
    let grantDeletionCount = 0;

    return Promise.all(messages.map(async (message) => {
        console.log('Processing message:', message.Body);

        let modificationEvent;
        try {
            modificationEvent = JSON.parse(message.Body).detail;
        } catch (e) {
            grantParseErrorCount += 1;
            console.error('Error parsing event data from SQS message:', e);
            return;
        }

        if (modificationEvent.type === 'delete') {
            grantDeletionCount += 1;
            const { opportunity } = modificationEvent.versions.previous;
            console.warn(`Received deletion event for Opportunity ID ${opportunity.id}`);
            return;
        }

        let grant;
        try {
            grant = mapSourceDataToGrant(modificationEvent.versions.new);
        } catch (e) {
            grantParseErrorCount += 1;
            console.error('Error mapping data from grant modification event:', e);
            return;
        }

        try {
            await upsertGrant(knex, grant);
            grantSaveSuccessCount += 1;
        } catch (e) {
            grantSaveErrorCount += 1;
            console.error(`Error on insert/update row with grant_id ${grant.grant_id}:`, e);
            return;
        }

        try {
            await deleteMessage(sqs, queueUrl, message.ReceiptHandle);
        } catch (e) {
            console.log(
                `Error deleting SQS message with receipt handle ${message.ReceiptHandle} `,
                `for grant ${grant.grant_id}`,
            );
            throw e;
        }

        console.log(`Processing completed successfully for grant ${grant.grant_id}`);
    })).then(() => {
        console.log(
            'Finished processing messages with the following results: ',
            `Grants Saved Successfully: ${grantSaveSuccessCount}`,
            `| Parsing Errors: ${grantParseErrorCount}`,
            `| Postgres Errors: ${grantSaveErrorCount}`,
            `| Unhandled Deletion Events: ${grantDeletionCount}`,
        );
    });
}

module.exports = {
    processMessages,
    receiveNextMessageBatch,
};
