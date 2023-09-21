/*
--------------------------------------------------------------------------------
-                         routes/reporting-periods.js
--------------------------------------------------------------------------------

*/
/* eslint camelcase: 0 */

const express = require('express');

const router = express.Router();

const multer = require('multer');

const multerUpload = multer({ storage: multer.memoryStorage() });

const knex = require('../../db/connection');
const {
    closeReportingPeriod,
    createReportingPeriod,
    getAllReportingPeriods,
    getReportingPeriod,
    updateReportingPeriod,
} = require('../db/reporting-periods');
const { requireUser, requireAdminUser } = require('../../lib/access-helpers');
const {
    savePeriodTemplate,
    templateForPeriod,
} = require('../services/get-template');
const { usedForTreasuryExport } = require('../db/uploads');
const { ensureAsyncContext } = require('../lib/ensure-async-context');

const { revalidateUploads } = require('../services/revalidate-uploads');
const { runCache } = require('../lib/audit-report');

router.get('/', requireUser, async (req, res) => {
    const periods = await getAllReportingPeriods();
    return res.json({ reportingPeriods: periods });
});

router.post('/close', requireAdminUser, async (req, res) => {
    const { user } = req.session;

    console.log(`Received request to close the current reporting period for User ${user.id}'s tenant.`);

    const period = await getReportingPeriod();

    const trns = await knex.transaction();
    try {
        await closeReportingPeriod(period, trns);
        trns.commit();
    } catch (err) {
        if (!trns.isCompleted()) trns.rollback();
        res.status(500).json({ error: err.message });
        return;
    }

    try {
        runCache(req.headers.host ?? "", period);
    } catch (err) {
        res.status(500).json({ error: err.message });
        return;
    }

    res.json({
        status: 'OK',
    });
});

router.post('/', requireAdminUser, async (req, res) => {
    const updatedPeriod = req.body.reportingPeriod;

    try {
        if (updatedPeriod.id) {
            const existing = await getReportingPeriod(updatedPeriod.id);
            if (!existing) {
                res.status(404).json({ error: 'invalid reporting period id' });
                return;
            }

            const period = await updateReportingPeriod(updatedPeriod);
            res.json({ reportingPeriod: period });
        } else {
            const period = await createReportingPeriod(updatedPeriod);
            res.json({ reportingPeriod: period });
        }
    } catch (e) {
        if (e.message.match(/violates unique constraint/)) {
            res.status(400).json({ error: 'Period conflicts with an existing one' });
        } else {
            res.status(500).json({ error: e.message });
        }
    }
});

router.post(
    '/:id/template',
    requireAdminUser,
    ensureAsyncContext(multerUpload.single('template')),
    async (req, res) => {
        if (!req.file) {
            res.status(400).json({ error: 'File missing' });
            return;
        }

        const periodId = req.params.id;
        const reportingPeriod = await getReportingPeriod(periodId);
        if (!reportingPeriod) {
            res.status(404).json({ error: 'Reporting period not found' });
            return;
        }

        const { originalname, size, buffer } = req.file;
        console.log(
            `Uploading filename ${originalname} size ${size} for period ${periodId}`,
        );

        try {
            await savePeriodTemplate(periodId, originalname, buffer);
        } catch (e) {
            res.status(500).json({
                success: false,
                errorMessage: e.message,
            });
            return;
        }

        res.json({ success: true });
    },
);

router.get('/:id/template', requireUser, async (req, res) => {
    const periodId = req.params.id;

    try {
        const { filename, data } = await templateForPeriod(periodId);

        res.header('Content-Disposition', `attachment; filename="${filename}"`);
        res.header('Content-Type', 'application/octet-stream');
        res.end(data);
    } catch (err) {
        if (err.code === 'ENOENT') {
            res.status(404).json({ error: 'Could not find template file' });
        } else {
            res.status(500).json({ error: err.message });
        }
    }
});

router.get('/:id/exported_uploads', requireUser, async (req, res) => {
    const periodId = req.params.id;

    try {
        const exportedUploads = await usedForTreasuryExport(periodId);
        res.json({ exportedUploads });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/:id/revalidate', requireAdminUser, async (req, res) => {
    const periodId = req.params.id;
    const commit = req.query.commit || false;

    const { user } = req.session;
    const reportingPeriod = await getReportingPeriod(periodId);
    if (!reportingPeriod) {
        res.sendStatus(404);
        res.end();
        return;
    }

    const trns = await knex.transaction();
    try {
        const updates = await revalidateUploads(reportingPeriod, user, trns);
        if (commit) {
            trns.commit();
        } else {
            trns.rollback();
        }

        res.json({
            updates,
        });
    } catch (e) {
        if (!trns.isCompleted()) trns.rollback();
        res.status(500).json({ error: e.message });
        throw e;
    }
});

module.exports = router;

/*                                 *  *  *                                    */

// NOTE: This file was copied from src/server/routes/reporting-periods.js (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z
