const { ReceiveMessageCommand, DeleteMessageCommand } = require('@aws-sdk/client-sqs');
const moment = require('moment');

const opportunityCategoryMap = {
    C: 'Continuation',
    D: 'Discretionary',
    E: 'Earmark',
    M: 'Mandatory',
    O: 'Other',
};

function normalizeDateString(dateString, formats = ['YYYY-MM-DD', 'MMDDYYYY']) {
    const target = 'YYYY-MM-DD';
    for (const fmt of formats) {
        const parsed = moment(dateString, fmt, true);
        if (parsed.isValid()) {
            const result = parsed.format(target);
            if (result !== dateString) {
                console.log(`Input date string ${dateString} normalized to ${result}`);
            }
            console.log(`Input date string ${dateString} already in target format ${target}`);
            return result;
        }
        console.log(`Failed to parse value ${dateString} as date using format ${fmt}`);
    }
    throw new Error(`Value ${dateString} could not be parsed from formats ${formats.join(', ')}`);
}

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

function sqsMessageToGrant(jsonBody) {
    const messageData = JSON.parse(jsonBody);
    return {
        status: 'inbox',
        grant_id: messageData.OpportunityId || messageData.grant_id,
        grant_number: messageData.OpportunityNumber,
        agency_code: messageData.AgencyCode,
        award_ceiling: (messageData.AwardCeiling && parseInt(messageData.AwardCeiling, 10))
            ? parseInt(messageData.AwardCeiling, 10) : undefined,
        award_floor: (messageData.AwardFloor && parseInt(messageData.AwardFloor, 10))
            ? parseInt(messageData.AwardFloor, 10) : undefined,
        cost_sharing: messageData.CostSharingOrMatchingRequirement ? 'Yes' : 'No',
        title: messageData.OpportunityTitle,
        cfda_list: (messageData.CFDANumbers || []).join(', '),
        open_date: normalizeDateString(messageData.PostDate),
        close_date: normalizeDateString(messageData.CloseDate || '2100-01-01'),
        notes: 'auto-inserted by script',
        search_terms: '[in title/desc]+',
        reviewer_name: 'none',
        opportunity_category: opportunityCategoryMap[messageData.OpportunityCategory],
        description: messageData.Description,
        eligibility_codes: (messageData.EligibleApplicants || []).join(' '),
        opportunity_status: 'posted',
        raw_body: JSON.stringify(messageData),
    };
}

async function upsertGrant(knex, grant) {
    await knex('grants')
        .insert(grant)
        .onConflict('grant_id')
        .merge({ ...grant, ...{ updated_at: 'now' } })
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
 * Any errors are logged do not prevent further processing of other messages.
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

    return Promise.all(messages.map(async (message) => {
        console.log('Processing message:', message.Body);

        let grant;
        try {
            grant = sqsMessageToGrant(message.Body);
        } catch (e) {
            grantParseErrorCount += 1;
            console.error('Error parsing grant from SQS message:', e);
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
        );
    });
}

module.exports = {
    processMessages,
    receiveNextMessageBatch,
};
