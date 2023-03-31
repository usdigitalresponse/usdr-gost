/* eslint camelcase: 0 */

const express = require('express');

const router = express.Router();

const { requireUser, getAdminAuthInfo } = require('../../lib/access-helpers');
const audit_report = require('../lib/audit-report');
const { useUser } = require('../use-request');
const aws = require('../lib/aws-client');

router.get('/:periodId/:filename', async (req, res) => {
    try {
        await getAdminAuthInfo(req);
    } catch (error) {
        res.redirect(encodeURI(`${process.env.WEBSITE_DOMAIN}/arpa_reporter/login?redirect_to=/api/audit_report/${req.params.periodId}/${req.params.filename}&message=Please login to visit the link.`));
        return;
    }
    const Key = `${req.params.periodId}/${req.params.filename}`;

    const s3 = aws.getS3Client();
    // Generate presigned url to get the object
    const baseParams = { Bucket: process.env.AUDIT_REPORT_BUCKET, Key };
    const metaData = await s3.headObject(baseParams).promise();

    if (!metaData) {
        res.redirect(`${process.env.WEBSITE_DOMAIN}/arpa_reporter?alert_text=The audit report you requested does not exist. Please try again by clicking the 'Send Audit Report By Email'.&alert_level=err`);
        return;
    }

    const signedUrl = await s3.getSignedUrl('getObject', { ...baseParams, Expires: 60 });
    res.redirect(signedUrl);
});

router.get('/', requireUser, async (req, res) => {
    console.log('/api/audit-report GET');

    if (req.query.async) {
        // Special handling for async audit report generation and sending.
        console.log('/api/audit-report?async=true GET');
        console.log('Generating Async audit report');
        try {
            const user = useUser();
            audit_report.generateAndSendEmail(req.headers.host, user.email);
            res.json({ success: true });
            return;
        } catch (error) {
            console.log(`Failed to generate and send audit report ${error}`);
            res.status(500).json({ error: 'Unable to generate audit report and send email.' });
            return;
        }
    }

    let report;
    try {
        report = await audit_report.generate(req.headers.host);
        console.log('Successfully generated report');
    } catch (error) {
    // In addition to sending the error message in the 500 response, log the full error stacktrace
        console.log(`Audit report generation failed. Logging the thrown error.`, error);
        res.status(500).send(error.message);
        return;
    }

    res.header(
        'Content-Disposition',
        `attachment; filename="${report.filename}"`,
    );
    res.header('Content-Type', 'application/octet-stream');
    res.send(Buffer.from(report.outputWorkBook, 'binary'));
});

module.exports = router;

/*                                  *  *  *                                   */

// NOTE: This file was copied from src/server/routes/audit-report.js (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z
