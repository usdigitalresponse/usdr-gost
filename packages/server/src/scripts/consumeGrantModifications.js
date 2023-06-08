#!/usr/bin/env node
const { getSQSClient } = require('../lib/gost-aws');
const knex = require('../db/connection');
const { processMessages, receiveNextMessageBatch } = require('../lib/grants-ingest');

async function main() {
    let shutDownRequested = false;

    process.on('SIGTERM', () => {
        console.log('SIGTERM received. Requesting shutdown...');
        shutDownRequested = true;
    });

    const queueUrl = process.env.GRANTS_INGEST_EVENTS_QUEUE_URL;
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
        await processMessages(knex, sqs, queueUrl, messages);
    }
    console.log('Shutting down');
}

if (require.main === module) {
    main.then(() => process.exit());
}
