const express = require('express');

const router = express.Router();
const _ = require('lodash');

const { requireUser } = require('../../lib/access-helpers');
const arpa = require('../services/generate-arpa-report');
const { getReportingPeriodID, getReportingPeriod } = require('../db/reporting-periods');

router.get('/', requireUser, async (req, res) => {
    const periodId = await getReportingPeriodID(req.query.period_id);
    const period = await getReportingPeriod(periodId);
    if (!period) {
        res.status(404).json({ error: 'invalid reporting period' });
        return;
    }

    const report = await arpa.generateReport(periodId);

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
