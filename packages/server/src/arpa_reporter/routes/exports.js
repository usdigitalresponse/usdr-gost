const express = require('express');

const router = express.Router();
const { HeadObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const _ = require('lodash');

const aws = require('../../lib/gost-aws');
const { requireUser, getAdminAuthInfo } = require('../../lib/access-helpers');
const arpa = require('../services/generate-arpa-report');
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
    const periodId = await getReportingPeriodID(req.query.period_id);
    const period = await getReportingPeriod(periodId);
    if (!period) {
        res.status(404).json({ error: 'invalid reporting period' });
        return;
    }
    const tenantId = useTenantId();

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

module.exports = router;

// NOTE: This file was copied from src/server/routes/exports.js (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z
