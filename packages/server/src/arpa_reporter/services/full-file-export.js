const { SendMessageCommand } = require('@aws-sdk/client-sqs');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const knex = require('../../db/connection');
const aws = require('../../lib/gost-aws');
const { bunyanLogger: log } = require('../../lib/logging');

const metadataFsName = (organizationId) => `/fullFileExport/${organizationId}/metadata.csv`;
const zipFileKey = (organizationId) => `/fullFileExport/${organizationId}/archive.zip`;

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
            SPLIT_PART(u1.filename, '.xlsm', 1) || '--' || u1.id || '.xlsm' AS filename_in_zip,
            CASE
                WHEN u1.invalidated_at IS NOT NULL THEN '/' || rp.name || '/Not Final Treasury/Invalid files/' || SPLIT_PART(u1.filename, '.xlsm', 1) || '--' || u1.id || '.xlsm'
                WHEN ue.id IS NOT NULL THEN '/' || rp.name || '/Final Treasury/' || SPLIT_PART(u1.filename, '.xlsm', 1) || '--' || u1.id || '.xlsm'
                WHEN u1.validated_at IS NOT NULL
                AND ue.id IS NULL THEN '/' || rp.name || '/Not Final Treasury/Valid files/' || SPLIT_PART(u1.filename, '.xlsm', 1) || '--' || u1.id || '.xlsm'
                ELSE NULL
            END AS directory_location,
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
    console.log('uploads', uploads);
    return uploads.rows;
}

async function generateAndUploadMetadata(organizationId, s3Key, logger = log) {
    const uploads = await getUploadsForArchive(organizationId);
    let data = ``;
    for (const upload of uploads) {
        data = data.concat('\n', `${upload.filename_in_zip},${upload.directory_location},${upload.agency_name},${upload.ec_code},${upload.reporting_period_name},${upload.validity}`);
    }
    const s3 = aws.getS3Client();
    const fileExportParams = {
        Bucket: process.env.AUDIT_REPORT_BUCKET,
        Key: s3Key,
        Body: Buffer.from(data),
        ServerSideEncryption: 'AES256',
    };
    logger.info('fileExportParams', fileExportParams);
    try {
        logger.info({ fileExportParams: { Bucket: fileExportParams.Bucket, Key: fileExportParams.Key } },
            'uploading full file export metadata to S3');
        await s3.send(new PutObjectCommand(fileExportParams));
    } catch (err) {
        console.log('error uploading full file export metadata to S3');
        console.log(err);
        logger.error({ err }, 'failed to upload full file export metadata to S3');
        throw err;
    }
    console.log('Successfully generated and uploaded ARPA full file export metadata');
    logger.info('finished generating and uploading ARPA full file export metadata');
}

/*
class S3Schema(pydantic.BaseModel):
    """Provides information about S3-hosted resources accessed during worker execution."""

    bucket: str
    zip_key: str
    metadata_key: str

class MessageSchema(pydantic.BaseModel):
    """Schema for messages received from the SQS queue"""

    s3: S3Schema
    organization_id: int
    user_email: str
*/
async function addMessageToQueue(organizationId, email) {
    const archiveKey = zipFileKey(organizationId);
    const metadataKey = metadataFsName(organizationId);
    await generateAndUploadMetadata(organizationId, metadataKey);
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
    await sqs.send(new SendMessageCommand({
        QueueUrl: process.env.FULL_FILE_EXPORT_SQS_QUEUE_URL,
        MessageBody: JSON.stringify(message),
    }));
}

module.exports = {
    addMessageToQueue,
    getUploadsForArchive,
    generateAndUploadMetadata,
};
