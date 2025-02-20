const { SendMessageCommand } = require('@aws-sdk/client-sqs');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const knex = require('../../db/connection');
const aws = require('../../lib/gost-aws');
const { log } = require('../../lib/logging');

const metadataFsName = (organizationId) => `full-file-export/org_${organizationId}/metadata.csv`;
const zipFileKey = (organizationId) => `full-file-export/org_${organizationId}/archive.zip`;

async function getUploadsForArchive(organizationId) {
    const uploads = await knex.raw(`
        WITH uploads_for_treasury_export AS (
            SELECT DISTINCT
                ON (u.reporting_period_id, u.agency_id, u.ec_code) u.id,
                u.created_at
            FROM
                uploads u
            WHERE
                u.tenant_id = ?
                AND u.validated_at IS NOT NULL
            ORDER BY
                u.reporting_period_id,
                u.agency_id,
                u.ec_code,
                u.created_at DESC
        )
        SELECT
            u1.id as upload_id,
            u1.filename as original_filename,
            SPLIT_PART(u1.filename, '.xlsm', 1) || '--' || u1.id || '.xlsm' AS filename_in_zip,
            CASE
                WHEN u1.invalidated_at IS NOT NULL THEN '/' || rp.name || '/Not Final Treasury/Invalid files/' || SPLIT_PART(u1.filename, '.xlsm', 1) || '--' || u1.id || '.xlsm'
                WHEN ue.id IS NOT NULL THEN '/' || rp.name || '/Final Treasury/' || SPLIT_PART(u1.filename, '.xlsm', 1) || '--' || u1.id || '.xlsm'
                WHEN u1.validated_at IS NOT NULL
                AND ue.id IS NULL THEN '/' || rp.name || '/Not Final Treasury/Valid files/' || SPLIT_PART(u1.filename, '.xlsm', 1) || '--' || u1.id || '.xlsm'
                ELSE NULL
            END AS path_in_zip,
            a.name AS agency_name,
            'EC' || u1.ec_code AS ec_code,
            rp.name AS reporting_period_name,
            CASE
                WHEN u1.invalidated_at IS NOT NULL THEN 'Invalidated at ' || invalidated_at || ' by ' || ui.email
                WHEN u1.validated_at IS NOT NULL THEN 'Validated at ' || validated_at || ' by ' || uv.email
                ELSE NULL
            END AS validity
        FROM
            uploads u1
            LEFT JOIN uploads_for_treasury_export ue ON ue.id = u1.id
            LEFT JOIN users uv ON uv.id = u1.validated_by
            LEFT JOIN users ui ON ui.id = u1.invalidated_by
            JOIN reporting_periods rp ON rp.id = u1.reporting_period_id
            JOIN agencies a ON a.id = u1.agency_id
        WHERE
            u1.tenant_id = ?
        ORDER BY
            rp.id,
            ue.id,
            u1.validated_at ASC
    `, [organizationId, organizationId]);
    return uploads.rows;
}

async function generateAndUploadMetadata(organizationId, s3Key, logger = log) {
    const uploads = await module.exports.getUploadsForArchive(organizationId);
    let data = `upload_id,original_filename,path_in_zip,agency_name,ec_code,reporting_period_name,validity`;
    for (const upload of uploads) {
        data = data.concat('\n', `${upload.upload_id},${upload.original_filename},${upload.path_in_zip},${upload.agency_name},${upload.ec_code},${upload.reporting_period_name},${upload.validity}`);
    }
    const fileExportParams = {
        Bucket: process.env.AUDIT_REPORT_BUCKET,
        Key: s3Key,
        Body: Buffer.from(data),
        ContentType: 'text/plain',
        ServerSideEncryption: 'AES256',
    };

    const s3 = aws.getS3Client();
    try {
        await s3.send(new PutObjectCommand(fileExportParams));
    } catch (err) {
        logger.error(err, 'failed to upload full file export metadata to S3');
        throw err;
    }
    logger.info('finished generating and uploading ARPA full file export metadata');
}

async function addMessageToQueue(organizationId, email, logger = log) {
    const archiveKey = zipFileKey(organizationId);
    const metadataKey = metadataFsName(organizationId);
    logger.child({ archiveKey, metadataKey });

    await module.exports.generateAndUploadMetadata(organizationId, metadataKey, logger);
    const message = {
        s3: {
            bucket: process.env.AUDIT_REPORT_BUCKET,
            zip_key: archiveKey,
            metadata_key: metadataKey,
        },
        organization_id: organizationId,
        user_email: email,
    };

    const sqs = aws.getSQSClient();
    try {
        await sqs.send(new SendMessageCommand({
            QueueUrl: process.env.ARPA_FULL_FILE_EXPORT_SQS_QUEUE_URL,
            MessageBody: JSON.stringify(message),
        }));
    } catch (err) {
        logger.error({ err }, 'failed to add full file export message to SQS queue');
        throw err;
    }
}

module.exports = {
    addMessageToQueue,
    getUploadsForArchive,
    generateAndUploadMetadata,
};
