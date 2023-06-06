const { ReceiveMessageCommand, DeleteMessageCommand } = require('@aws-sdk/client-sqs');

const opportunityCategoryMap = {
    C: 'Continuation',
    D: 'Discretionary',
    E: 'Earmark',
    M: 'Mandatory',
    O: 'Other',
};

/**
 * receiveNextMessageBatch long-polls an SQS queue for up to 10 messages.
 * @param {SQSClient} sqs AWS SDK client used to issue commands to the SQS API.
 * @param {string} queueUrl The URL identifying the queue to poll.
 * @returns {Array[ReceiveMessageCommandOutput]} Received messages, if any.
 */
async function receiveNextMessageBatch(sqs, queueUrl) {
    let messages = [];
    try {
        const resp = await sqs.send(new ReceiveMessageCommand({
            QueueUrl: queueUrl,
            WaitTimeSeconds: 20,
            MaxNumberOfMessages: 10,
        }));
        if (resp && resp.Messages && resp.Messages.length > 0) {
            messages = resp.Messages;
        }
    } catch (e) {
        console.error('Error receiving SQS messages:', e);
        return messages;
    }

    if (messages.length === 0) {
        console.log('Empty message batch received from SQS');
    }
    return messages;
}

function sqsMessageToGrant(jsonBody) {
    const messageData = JSON.parse(jsonBody);
    return {
        status: 'inbox',
        grant_id: messageData.OpportunityId,
        grant_number: messageData.OpportunityNumber,
        agency_code: messageData.AgencyCode,
        award_ceiling: (messageData.AwardCeiling && parseInt(messageData.AwardCeiling, 10))
            ? parseInt(messageData.AwardCeiling, 10) : undefined,
        award_floor: (messageData.AwardFloor && parseInt(messageData.AwardFloor, 10))
            ? parseInt(messageData.AwardFloor, 10) : undefined,
        cost_sharing: messageData.CostSharingOrMatchingRequirement ? 'Yes' : 'No',
        title: messageData.OpportunityTitle,
        cfda_list: (messageData.CFDANumbers || []).join(', '),
        open_date: messageData.PostDate,
        close_date: messageData.CloseDate || '2100-01-01',
        notes: 'auto-inserted by script',
        search_terms: '[in title/desc]+',
        reviewer_name: 'none',
        opportunity_category: opportunityCategoryMap[messageData.OpportunityCategory],
        description: messageData.Description,
        eligibility_codes: (messageData.EligibleApplicants || []).join(' '),
        opportunity_status: 'posted',
    };
}

async function upsertGrant(knex, grant) {
    await knex('grants')
        .insert(grant)
        .onConflict('grant_id')
        .merge()
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
 * @param {Knex} knex Database client for persisting grants.
 * @param {SQSClient} sqs AWS SDK client used to issue commands to the SQS API.
 * @param {string} queueUrl The URL identifying the queue to poll.
 */
async function processMessages(knex, sqs, queueUrl, messages) {
    let sqsDeleteErrorCount = 0;
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
            sqsDeleteErrorCount += 1;
            console.error(`Error deleting SQS message for grant ${grant.grant_id}:`, e);
            return;
        }

        console.log(`Processing completed successfully for grant ${grant.grant_id}`);
    })).then(() => {
        console.log(
            'Finished processing messages with the following results: ',
            `Grants Saved Successfully: ${grantSaveSuccessCount}`,
            `| SQS Message Delete Failures: ${sqsDeleteErrorCount}`,
            `| Parsing Errors: ${grantParseErrorCount}`,
            `| Postgres Errors: ${grantSaveErrorCount}`,
        );
    });
}

module.exports = {
    processMessages,
    receiveNextMessageBatch,
};
