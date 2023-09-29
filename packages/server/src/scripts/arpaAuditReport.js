#!/usr/bin/env node
const tracer = require('dd-trace').init(); // eslint-disable-line no-unused-vars
const { ReceiveMessageCommand, DeleteMessageCommand } = require('@aws-sdk/client-sqs');
const { getSQSClient } = require('../lib/gost-aws');
const { processSQSMessageRequest } = require('../arpa_reporter/lib/audit-report');

async function main() {
    let shutDownRequested = false;
    const requestShutdown = (signal) => {
        console.log(`${signal} received. Requesting shutdown...`);
        shutDownRequested = true;
    };
    process.on('SIGTERM', requestShutdown);
    process.on('SIGINT', requestShutdown);

    const queueUrl = process.env.TASK_QUEUE_URL;
    const sqs = getSQSClient();
    while (shutDownRequested === false) {
        console.log(`Long-polling next SQS message batch from ${queueUrl}`);
        // eslint-disable-next-line no-await-in-loop
        const receiveResp = await sqs.send(new ReceiveMessageCommand({
            QueueUrl: queueUrl,
            WaitTimeSeconds: 20,
            MaxNumberOfMessages: 1,
        }));
        const message = (receiveResp?.Messages || [])[0];
        if (message !== undefined) {
            // eslint-disable-next-line no-await-in-loop
            const processingSuccessful = await processSQSMessageRequest(message);
            if (processingSuccessful === true) {
                // eslint-disable-next-line no-await-in-loop
                await sqs.send(new DeleteMessageCommand({
                    QueueUrl: queueUrl,
                    ReceiptHandle: message.ReceiptHandle,
                }));
            }
        } else {
            console.log('Empty messages batch received from SQS');
        }
    }
    console.log('Shutting down');
}

if (require.main === module) {
    main().then(() => process.exit());
}
