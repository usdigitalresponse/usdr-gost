#!/usr/bin/env node
const { ReceiveMessageCommand, DeleteMessageCommand } = require('@aws-sdk/client-sqs');
const { getSQSClient } = require('../lib/gost-aws');
const knex = require('../db/connection');

const opportunityCategoryMap = {
    C: 'Continuation',
    D: 'Discretionary',
    E: 'Earmark',
    M: 'Mandatory',
    O: 'Other',
};

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
        console.log('Error receiving SQS messages:', e);
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
        cfda_list: (messageData.CFDANumbers && messageData.CFDANumbers.join(', ')),
        open_date: messageData.PostDate,
        close_date: messageData.CloseDate || '2100-01-01',
        notes: 'auto-inserted by script',
        search_terms: '[in title/desc]+',
        reviewer_name: 'none',
        opportunity_category: opportunityCategoryMap[messageData.OpportunityCategory],
        description: messageData.Description,
        eligibility_codes: messageData.EligibleApplicants.join(' '),
        opportunity_status: 'posted',
    };
}

async function upsertGrant(grant) {
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

async function processMessages(sqs, queueUrl, messages) {
    let sqsDeleteErrorCount = 0;
    let grantParseErrorCount = 0;
    let grantSaveSuccessCount = 0;
    let grantSaveErrorCount = 0;

    await messages.forEach(async (message) => {
        console.log('Processing message:', message.Body);

        let grant;
        try {
            grant = sqsMessageToGrant(message.Body);
        } catch (e) {
            grantParseErrorCount += 1;
            console.log('Error parsing grant from SQS message:', e);
            return;
        }

        try {
            await upsertGrant(grant);
            grantSaveSuccessCount += 1;
        } catch (e) {
            grantSaveErrorCount += 1;
            console.log(`Error on insert/update row with grant_id ${grant.grant_id}:`, e);
            return;
        }

        try {
            await deleteMessage(sqs, queueUrl, message.ReceiptHandle);
        } catch (e) {
            sqsDeleteErrorCount += 1;
            console.log(`Error deleting SQS message for grant ${grant.grant_id}:`, e);
            return;
        }

        console.log(`Processing completed successfully for grant ${grant.grant_id}`);
    });

    console.log(
        'Finished processing messages with the following results: '
        + `Grants Saved Successfully: ${grantSaveSuccessCount}`
        + ` | SQS Message Delete Failures: ${sqsDeleteErrorCount}`
        + ` | Parsing Errors: ${grantParseErrorCount}`
        + ` | Postgres Errors: ${grantSaveErrorCount}`,
    );
}

async function main() {
    let shutDownRequested = false;

    process.on('SIGTERM', () => {
        console.log('SIGTERM received. Requesting shutdown...');
        shutDownRequested = true;
    });

    const queueUrl = process.env.GRANT_INGEST_EVENTS_QUEUE_URL;
    const sqs = getSQSClient();
    while (shutDownRequested === false) {
        console.log(`Long-polling next SQS message batch from ${queueUrl}`);
        // eslint-disable-next-line no-await-in-loop
        const messages = await receiveNextMessageBatch(sqs, queueUrl);
        if (shutDownRequested === true) {
            console.warn(
                'Shutdown requested before messages could be processed;',
                'messages will be unavailable until the queue visibility timeout has elapsed.',
            );
            break;
        }
        // eslint-disable-next-line no-await-in-loop
        await processMessages(sqs, queueUrl, messages);
    }
    console.log('Shutting down');
}

if (require.main === module) {
    main.then(process.exit(0));
}
