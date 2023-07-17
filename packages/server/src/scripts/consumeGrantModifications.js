#!/usr/bin/env node
const tracer = require('dd-trace').init(); // eslint-disable-line no-unused-vars
const { getSQSClient } = require('../lib/gost-aws');
const knex = require('../db/connection');
const { processMessages, receiveNextMessageBatch } = require('../lib/grants-ingest');

async function main() {
    let shutDownRequested = false;
    const requestShutdown = (signal) => {
        console.log(`${signal} received. Requesting shutdown...`);
        shutDownRequested = true;
    };
    process.on('SIGTERM', requestShutdown);
    process.on('SIGINT', requestShutdown);

    const queueUrl = process.env.GRANTS_INGEST_EVENTS_QUEUE_URL;
    const sqs = getSQSClient();
    while (shutDownRequested === false) {
        console.log(`Long-polling next SQS message batch from ${queueUrl}`);
        // eslint-disable-next-line no-await-in-loop
        const messages = await receiveNextMessageBatch(sqs, queueUrl);
        if (messages.length > 0) {
            // eslint-disable-next-line no-await-in-loop
            await processMessages(knex, sqs, queueUrl, messages);
        }
    }
    console.log('Shutting down');
}

if (require.main === module) {
    main().then(() => process.exit());
}
