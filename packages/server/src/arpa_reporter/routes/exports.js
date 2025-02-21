const express = require('express');

const router = express.Router();
const { HeadObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const _ = require('lodash');
const { SendMessageCommand } = require('@aws-sdk/client-sqs');
const { DateTime } = require('luxon');

const aws = require('../../lib/gost-aws');
const { requireUser, getAdminAuthInfo, requireAdminUser } = require('../../lib/access-helpers');
const arpa = require('../services/generate-arpa-report');
const fullFileExport = require('../services/full-file-export');
const { getReportingPeriodID, getReportingPeriod } = require('../db/reporting-periods');
const { useTenantId, useUser } = require('../use-request');

router.get('/:tenantId/:periodId/:filename', async (req, res) => {
    let user;
    try {
        const info = await getAdminAuthInfo(req);
        user = info.user;
        if (user.tenant_id !== Number(req.params.tenantId)) {
            throw new Error('Unauthorized');
        }
    } catch (error) {
        res.redirect(encodeURI(`${process.env.WEBSITE_DOMAIN}/arpa_reporter/login?redirect_to=/api/exports/${req.params.tenantId}/${req.params.periodId}/${req.params.filename}&message=Please login to visit the link.`));
        return;
    }

    const s3 = aws.getS3Client();
    const Key = `${user.tenant_id}/${req.params.periodId}/${req.params.filename}`;
    const baseParams = { Bucket: process.env.AUDIT_REPORT_BUCKET, Key };

    try {
        await s3.send(new HeadObjectCommand(baseParams));
    } catch (error) {
        console.log(error);
        res.redirect(encodeURI(`${process.env.WEBSITE_DOMAIN}/arpa_reporter?alert_text=The treasury report you requested has expired. Please try again by clicking the 'Send Treasury Report By Email'.&alert_level=err`));
        return;
    }

    let signedUrl;
    try {
        signedUrl = await aws.getSignedUrl(s3, new GetObjectCommand(baseParams), { expiresIn: 60 });
    } catch (error) {
        console.log(error);
        res.redirect(`${process.env.WEBSITE_DOMAIN}/arpa_reporter?alert_text=Something went wrong. Please reach out to grants-helpdesk@usdigitalresponse.org.&alert_level=err`);
        return;
    }
    res.redirect(signedUrl);
});

router.get('/', requireUser, async (req, res) => {
    const periodId = req.query.period_id ?? await getReportingPeriodID(req.query.period_id);
    const period = await getReportingPeriod(periodId);
    if (!period) {
        res.status(404).json({ error: 'invalid reporting period' });
        return;
    }
    const tenantId = useTenantId();

    if (req.query.queue) {
        // Special handling for deferring treasury report generation and sending to a task queue
        console.log('/api/exports?queue=true GET');
        console.log('Generating Async treasury report via task queue');
        try {
            const user = useUser();
            const sqs = aws.getSQSClient();
            await sqs.send(new SendMessageCommand({
                QueueUrl: process.env.ARPA_TREASURY_REPORT_SQS_QUEUE_URL,
                MessageBody: JSON.stringify({ userId: user.id, periodId, tenantId }),
            }));
            res.json({ success: true });
            return;
        } catch (error) {
            console.log(`Failed to generate and send treasury report ${error}`);
            res.status(500).json({ error: 'Unable to generate treasury report and send email.' });
            return;
        }
    }

    if (req.query.async) {
        // Special handling for async treasury report generation and sending.
        console.log('/api/exports?async=true GET');
        console.log('Generating Async treasury report');
        try {
            const user = useUser();
            arpa.generateAndSendEmail(user.email, periodId, tenantId);
            res.json({ success: true });
            return;
        } catch (error) {
            console.log(`Failed to generate and send treasury report ${error}`);
            res.status(500).json({ error: 'Unable to generate treasury report and send email.' });
            return;
        }
    }

    const report = await arpa.generateReport(periodId, tenantId);

    if (_.isError(report)) {
        res.status(500).send(report.message);
        return;
    }

    res.header(
        'Content-Disposition',
        `attachment; filename="${report.filename}"`,
    );
    res.header('Content-Type', 'application/octet-stream');
    res.send(Buffer.from(report.content, 'binary'));
});

router.get('/fullFileExport', requireAdminUser, async (req, res) => {
    const { user } = req.session;
    const organizationId = user.tenant_id;
    const logger = req.log.child({ organizationId, userId: user.id });

    try {
        await fullFileExport.addMessageToQueue(organizationId, user.email, logger);
        res.json({ success: true });
    } catch (error) {
        logger.error(error, 'Failed to generate and send full file export');
        res.status(500).json({ error: 'Unable to generate full file export and send email.' });
    }
});

router.get('/getFullFileExport/:downloadType(archive|metadata)', requireUser, async (req, res) => {
    const { user } = req.session;
    const { downloadType } = req.params;
    let logger = req.log.child({ S3Bucket: process.env.AUDIT_REPORT_BUCKET, downloadType });

    const archiveS3Key = `fullFileExport/${user.tenant_id}/archive.zip`;
    const metadataS3Key = `fullFileExport/${user.tenant_id}/archive_metadata.csv`;
    let downloadS3Key;
    let downloadFilenameBase;
    let downloadExtension;
    if (downloadType === 'archive') {
        downloadS3Key = archiveS3Key;
        downloadFilenameBase = `FullFileExport`;
        downloadExtension = 'zip';
    } else if (downloadType === 'metadata') {
        downloadS3Key = metadataS3Key;
        downloadFilenameBase = 'FullFileExportMetadata';
        downloadExtension = 'csv';
    }
    logger = logger.child({ downloadS3Key, archiveS3Key, metadataS3Key });
    logger.info('preparing redirect to pre-signed url for requested download');

    const errRedirect = () => {
        const url = new URL(process.env.WEBSITE_DOMAIN);
        url.pathname = 'arpa_reporter';
        const alertText = 'The export you requested has expired or does not exist. '
            + 'Please try again by clicking the "Send Full File Export by Email" button.';
        url.searchParams.set('alert_text', alertText);
        url.searchParams.set('alert_level', 'err');
        logger.info({ redirectUrl: url.toString(), alertText },
            'redirecting user to home page with error message');
        return res.redirect(url.toString());
    };

    const s3 = aws.getS3Client();
    let metadataLastModified;
    try {
        metadataLastModified = (await s3.send(new HeadObjectCommand({
            Bucket: process.env.AUDIT_REPORT_BUCKET, Key: metadataS3Key,
        }))).LastModified;
        logger.info({ metadataLastModified }, 'retrieved last-modified date for metadata S3 object');
    } catch (err) {
        logger.error(err, 'error retrieving HeadObject output for metadata S3 object');
        return errRedirect();
    }

    const downloadFilenameDate = DateTime.fromJSDate(metadataLastModified).toFormat('MM.dd.yyyy.HH.mm.ss');
    const fullFilename = `${downloadFilenameBase}-${downloadFilenameDate}.${downloadExtension}`;
    logger = logger.child({ attachmentFilename: fullFilename });

    let signedUrl;
    const downloadExpiresInSeconds = 60;
    try {
        signedUrl = await aws.getSignedUrl(s3, new GetObjectCommand({
            Bucket: process.env.AUDIT_REPORT_BUCKET,
            Key: downloadS3Key,
            ResponseContentDisposition: `attachment; filename="${fullFilename}"`,
        }), { expiresIn: downloadExpiresInSeconds });
    } catch (err) {
        logger.error(err, 'error retrieving signed URL for requested S3 object');
        return errRedirect();
    }

    logger.info({ downloadExpiresInSeconds },
        'redirecting to pre-signed url for S3 GetObject command');
    res.redirect(signedUrl);
});

module.exports = router;
