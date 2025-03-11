const { SendMessageCommand } = require('@aws-sdk/client-sqs');
const { HeadObjectCommand, PutObjectCommand, NotFound } = require('@aws-sdk/client-s3');
const converter = require('json-2-csv');
const path = require('path');
const moment = require('moment');
const knex = require('../../db/connection');
const aws = require('../../lib/gost-aws');
const { log } = require('../../lib/logging');

const metadataFileKey = (organizationId) => `full-file-export/org_${organizationId}/metadata.csv`;
const zipFileKey = (organizationId) => `full-file-export/org_${organizationId}/archive.zip`;

function getFilenameInZip(upload) {
    const extension = path.extname(upload.original_filename);
    const filename = path.basename(upload.original_filename, extension);
    return `${filename}--${upload.upload_id}${extension}`;
}

function getValidity(upload) {
    let validity_message = '';

    if (upload.invalidated_at) {
        validity_message = `Invalidated at ${moment.utc(upload.invalidated_at).format('YYYY-MM-DDTHH:mm:ss')} by ${upload.invalidated_by_email}`;
    } else if (upload.validated_at) {
        validity_message = `Validated at ${moment.utc(upload.validated_at).format('YYYY-MM-DDTHH:mm:ss')} by ${upload.validated_by_email}`;
    } else {
        validity_message = `Did not pass validation at ${moment.utc(upload.created_at).format('YYYY-MM-DDTHH:mm:ss')} by ${upload.created_by_email}`;
    }

    return validity_message;
}

function getPathInZip(upload, filename_in_zip) {
    // update to build string using nodejs path module
    let path_in_zip = '';

    if (upload.invalidated_at) {
        path_in_zip = path.join(upload.reporting_period_name, 'Not Final Treasury', 'Invalid files', filename_in_zip);
    } else if (upload.is_included_in_treasury_export) {
        path_in_zip = path.join(upload.reporting_period_name, 'Final Treasury', filename_in_zip);
    } else if (upload.validated_at && !upload.is_included_in_treasury_export) {
        path_in_zip = path.join(upload.reporting_period_name, 'Not Final Treasury', 'Valid files', filename_in_zip);
    } else {
        path_in_zip = path.join(upload.reporting_period_name, 'Not Final Treasury', 'Invalid files', filename_in_zip);
    }

    return path_in_zip;
}

async function addUploadInfo(uploads) {
    const uploadsWithInfo = uploads.map((upload) => {
        const filename_in_zip = getFilenameInZip(upload);
        const path_in_zip = getPathInZip(upload, filename_in_zip);
        const validity = getValidity(upload);
        const uploadInfo = {
            upload_id: upload.upload_id,
            original_filename: upload.original_filename,
            filename_in_zip,
            path_in_zip,
            agency_name: upload.agency_name,
            ec_code: upload.ec_code,
            reporting_period_name: upload.reporting_period_name,
            validity,
        };
        return uploadInfo;
    });
    return uploadsWithInfo;
}

async function getMetadataLastModified(organizationId, logger = log) {
    // check if metadata file already exists
    const s3 = aws.getS3Client();
    const Key = metadataFileKey(organizationId);
    const baseParams = { Bucket: process.env.AUDIT_REPORT_BUCKET, Key };

    let headObject;

    try {
        headObject = await s3.send(new HeadObjectCommand(baseParams));
    } catch (error) {
        if (error instanceof NotFound) {
            logger.info('metadata file does not exist');
            return null;
        }
        logger.error(error, 'failed to get existing metadata file');
        throw error;
    }

    if (headObject && headObject.LastModified) {
        return headObject.LastModified;
    }
    return null;
}

function getUploadLastUpdate(upload) {
    if (upload.validated_at) return upload.validated_at;
    if (upload.invalidated_at) return upload.invalidated_at;
    return upload.created_at;
}

async function shouldRecreateArchive(organizationId, uploads, logger = log) {
    const metadataLastModified = await getMetadataLastModified(organizationId, logger);

    if (metadataLastModified) {
        const metadataLastModifiedMoment = moment(metadataLastModified);
        return uploads.some((upload) => moment(getUploadLastUpdate(upload)).isAfter(metadataLastModifiedMoment));
    }
    return true;
}

async function getUploadsForArchive(organizationId) {
    /* eslint-disable */
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
            a.name AS agency_name,
            'EC' || u1.ec_code AS ec_code,
            rp.name AS reporting_period_name,
            u1.created_at,
            u1.validated_at,
            u1.invalidated_at,
            uv.email AS validated_by_email,
            ui.email AS invalidated_by_email,
            uc.email AS created_by_email,
            ue.id AS is_included_in_treasury_export
        FROM
            uploads u1
            LEFT JOIN uploads_for_treasury_export ue ON ue.id = u1.id
            LEFT JOIN users uv ON uv.id = u1.validated_by
            LEFT JOIN users ui ON ui.id = u1.invalidated_by
            LEFT JOIN users uc ON uc.id = u1.user_id
            JOIN reporting_periods rp ON rp.id = u1.reporting_period_id
            JOIN agencies a ON a.id = u1.agency_id
        WHERE
            u1.tenant_id = ?
        ORDER BY
            rp.id,
            ue.id,
            u1.validated_at ASC
    `, [organizationId, organizationId]);
    /* eslint-enable */

    const uploadsWithInfo = await addUploadInfo(uploads.rows);
    return uploadsWithInfo;
}

async function generateAndUploadMetadata(organizationId, s3Key, logger = log) {
    const uploads = await module.exports.getUploadsForArchive(organizationId);
    const archiveIsStale = await module.exports.shouldRecreateArchive(organizationId, uploads, logger);
    const data = await converter.json2csv(uploads);

    const fileExportParams = {
        Bucket: process.env.AUDIT_REPORT_BUCKET,
        Key: s3Key,
        Body: Buffer.from(data),
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

    return archiveIsStale;
}

async function addMessageToQueue(organizationId, email, logger = log) {
    const archiveKey = zipFileKey(organizationId);
    const metadataKey = metadataFileKey(organizationId);
    logger.child({ archiveKey, metadataKey });

    const archiveIsStale = await module.exports.generateAndUploadMetadata(organizationId, metadataKey, logger);
    const message = {
        s3: {
            bucket: process.env.AUDIT_REPORT_BUCKET,
            zip_key: archiveKey,
            metadata_key: metadataKey,
        },
        organization_id: organizationId,
        user_email: email,
        recreate_archive: archiveIsStale || false,
    };

    const sqs = aws.getSQSClient();
    try {
        await sqs.send(new SendMessageCommand({
            QueueUrl: process.env.ARPA_FULL_FILE_EXPORT_SQS_QUEUE_URL,
            MessageBody: JSON.stringify(message),
        }));
    } catch (err) {
        logger.error(err, 'failed to add full file export message to SQS queue');
        throw err;
    }
}

module.exports = {
    addMessageToQueue,
    getUploadsForArchive,
    generateAndUploadMetadata,
    metadataFileKey,
    zipFileKey,
    shouldRecreateArchive, // for testing
    getUploadLastUpdate, // for testing
};
