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
        // eslint-disable-next-line no-await-in-loop
        await tracer.trace('arpaAuditReport', async () => {
            console.log(`Long-polling next SQS message batch from ${queueUrl}`);
            const receiveResp = await sqs.send(new ReceiveMessageCommand({
                QueueUrl: process.env.TASK_QUEUE_URL, WaitTimeSeconds: 20, MaxNumberOfMessages: 1,
            }));
            const message = (receiveResp?.Messages || [])[0];
            if (message !== undefined) {
                tracer.scope().active().setTag('message_received', 'true');
                const processingSuccessful = await tracer.trace('processSQSMessageRequest',
                    async (span) => {
                        try {
                            return await processSQSMessageRequest(message);
                        } catch (e) {
                            console.error(
                                'Error processing SQS message request for ARPA audit report:', e,
                            );
                            span.setTag('error', e);
                        }
                        return false;
                    });
                if (processingSuccessful === true) {
                    console.log('Deleting successfully-processed SQS message');
                    tracer.scope().active().setTag('processing_successful', 'true');
                    // eslint-disable-next-line no-await-in-loop
                    await sqs.send(new DeleteMessageCommand({
                        QueueUrl: queueUrl,
                        ReceiptHandle: message.ReceiptHandle,
                    }));
                } else {
                    console.log('SQS message was not processed successfully; will not delete');
                    tracer.scope().active().setTag('processing_successful', 'false');
                }
            } else {
                tracer.scope().active().setTag('message_received', 'false');
                console.log('Empty messages batch received from SQS');
            }
        });
    }
    console.log('Shutting down');
}

if (require.main === module) {
    main().then(() => process.exit());
}
