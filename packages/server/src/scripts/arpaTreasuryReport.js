#!/usr/bin/env node
const tracer = require('dd-trace').init(); // eslint-disable-line no-unused-vars
const { ReceiveMessageCommand, DeleteMessageCommand } = require('@aws-sdk/client-sqs');
const { log } = require('../lib/logging');
const { getSQSClient } = require('../lib/gost-aws');
const { processSQSMessageRequest } = require('../arpa_reporter/services/generate-arpa-report');

async function main() {
    let shutDownRequested = false;
    const requestShutdown = (signal) => {
        log.warn({ signal }, 'Shutdown signal received. Requesting shutdown...');
        shutDownRequested = true;
    };
    process.on('SIGTERM', requestShutdown);
    process.on('SIGINT', requestShutdown);

    const queueUrl = process.env.TREASURY_REPORT_TASK_QUEUE_URL;
    const sqs = getSQSClient();
    while (shutDownRequested === false) {
        // eslint-disable-next-line no-await-in-loop
        await tracer.trace('arpaAuditReport', async () => {
            log.info({ queueUrl }, 'Long-polling next SQS message batch');
            const receiveResp = await sqs.send(new ReceiveMessageCommand({
                QueueUrl: process.env.TREASURY_REPORT_TASK_QUEUE_URL, WaitTimeSeconds: 20, MaxNumberOfMessages: 1,
            }));
            const message = (receiveResp?.Messages || [])[0];
            if (message !== undefined) {
                const msgLog = log.child({ sqs: { message: { ReceiptHandle: message.ReceiptHandle } } });
                tracer.scope().active().setTag('message_received', 'true');
                const processingSuccessful = await tracer.trace('processSQSMessageRequest',
                    async (span) => {
                        try {
                            return await processSQSMessageRequest(message);
                        } catch (e) {
                            msgLog.error(e, 'Error processing SQS message request for ARPA audit report');
                            span.setTag('error', e);
                        }
                        return false;
                    });
                if (processingSuccessful === true) {
                    msgLog.info('Deleting successfully-processed SQS message');
                    tracer.scope().active().setTag('processing_successful', 'true');
                    await sqs.send(new DeleteMessageCommand({
                        QueueUrl: queueUrl,
                        ReceiptHandle: message.ReceiptHandle,
                    }));
                } else {
                    msgLog.warn('SQS message was not processed successfully; will not delete');
                    tracer.scope().active().setTag('processing_successful', 'false');
                }
            } else {
                tracer.scope().active().setTag('message_received', 'false');
                log.info('Empty messages batch received from SQS');
            }
        });
    }
    log.warn('Shutting down');
}

if (require.main === module) {
    main().then(() => process.exit());
}
