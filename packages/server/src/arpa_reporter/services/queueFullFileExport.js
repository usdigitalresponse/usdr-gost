const fs = require('fs/promises');
const { SendMessageCommand } = require('@aws-sdk/client-sqs');
const { UPLOAD_DIR } = require('../environment');
const knex = require('../../db/connection');
const aws = require('../../lib/gost-aws');
// Query the database for all the uploads and kick-off SQS Message with the following schema
/*
class S3Schema(BaseModel):
    bucket: str
    key: str

class MessageSchema(BaseModel):
    s3: S3Schema
    organization_id: int
    metadata_filename: str
*/
// Also save the query in DATA_DIR/metadata/metadata_{datetime}.csv file

const metadataFsName = (date, organizationId) => { `${UPLOAD_DIR}/metadata/${organizationId}/metadata_${date.toISOString()}.csv`; };

// : `${user.tenant_id}/fullFileExport/${req.params.filename}`
const zipFileKey = (date, organizationId) => { `${organizationId}/fullFileExport/FullFileExport${date.toISOString()}.zip`; };

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
    return uploads.rows;
}

async function persistMetadataFile(organizationId, filename) {
    const uploads = await getUploadsForArchive(organizationId);
    const data = ``;
    for (const upload of uploads) {
        data.concat('\n', `${upload.filename_in_zip},${upload.directory_location},${upload.agency_name},${upload.ec_code},${upload.reporting_period_name},${upload.validity}`);
    }
    fs.writeFile(filename, data, 'utf-8', (err) => {
        if (err) console.log(err);
        else console.log('Data saved');
    });
}

async function addMessageToQueue(organizationId, email) {
    const curDate = new Date();
    const metadataFilename = metadataFsName(organizationId, curDate);
    const fileKey = await zipFileKey(curDate, organizationId);
    await persistMetadataFile(organizationId, metadataFilename);
    const message = {
        s3: {
            bucket: process.env.AUDIT_REPORT_BUCKET,
            key: fileKey,
        },
        user_email: email,
        organization_id: organizationId,
        metadata_filename: metadataFsName(organizationId),
    };

    const sqs = aws.getSQSClient();
    await sqs.send(new SendMessageCommand({
        QueueUrl: process.env.FULL_FILE_EXPORT_SQS_QUEUE_URL,
        MessageBody: JSON.stringify(message),
    }));
}

module.exports = {
    addMessageToQueue,
};
