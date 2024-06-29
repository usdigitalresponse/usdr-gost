const tracer = require('dd-trace').init();
const { mapSourceDataToGrant, upsertGrant } = require('../../lib/grants-ingest');
const { knex } = require('../../db');
const { logging } = require('../../lib/lambdaUtil');

const withRequest = logging.lambdaRequestTracker();

async function processMessage(message, logger) {
    logger.info('parsing modificationEvent JSON from message body');
    const modificationEvent = JSON.parse(message.Body).detail;
    logger.setBindings({ modificationEventType: modificationEvent.type });
    if (modificationEvent.type === 'delete') {
        logger.console.warn('received unexpected grant modificiation event type');
        return;
    }

    logger.info('mapping source data to grant record');
    const grant = mapSourceDataToGrant(modificationEvent.versions.new);
    logger.setBindings({ grant_id: grant.grant_id });

    logger.info('upserting grant record to database');
    await upsertGrant(knex, grant);

    logger.info('processed grant record successfully');
}

async function handler(event, context) {
    withRequest(event, context);
    const logger = logging.logger.child({ sqsBatchCount: event.records.length });
    logger.info('received SQS message batch');

    const response = { batchItemFailures: [] };
    await Promise.all(event.records.map(async (record) => {
        await tracer.trace('handleMessage', async (span) => {
            const messageLogger = logger.child({ sqsMessageId: record.messageId });
            try {
                await processMessage(record, messageLogger);
                span.addTags({ success: true });
            } catch (err) {
                messageLogger.error({ err }, 'failed to process SQS message');
                span.addTags({ success: false });
                response.batchItemFailures.push({ itemIdentifier: record.messageId });
            }
        });
    }));

    logger.info({ batchItemFailureCount: response.batchItemFailures.length },
        'processed SQS message batch');
    return response;
}

module.exports = { handler };
