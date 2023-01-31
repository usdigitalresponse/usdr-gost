const express = require('express');

const router = express.Router({ mergeParams: true });
const multer = require('multer');

const multerUpload = multer({ storage: multer.memoryStorage() });
const XLSX = require('xlsx');
const { ensureAsyncContext } = require('../arpa_reporter/lib/ensure-async-context');
const {
    requireAdminUser,
    requireUser,
    isUserAuthorized,
    requireUSDRSuperAdminUser,
} = require('../lib/access-helpers');
const {
    getAgency,
    getTenantAgencies,
    setAgencyThresholds,
    createAgency,
    setAgencyName,
    setAgencyAbbr,
    setAgencyParent,
    setAgencyCode,
    deleteAgency,
} = require('../db');
const AgencyImporter = require('../lib/agencyImporter');
const email = require('../lib/email');

router.get('/', requireUser, async (req, res) => {
    const { user } = req.session;
    const response = await getTenantAgencies(user.tenant_id);
    res.json(response);
});

router.get('/sendDigestEmail', requireUSDRSuperAdminUser, async (req, res) => {
    const { user } = req.session;
    const agency = await getAgency(parseInt(req.params.organizationId, 10));
    try {
        await email.sendGrantDigestForAgency(agency[0]);
    } catch (e) {
        console.error(`Unable to kick-off digest email for ${req.params.organizationId} by user ${user.id} due to error ${e}}`);
        res.sendStatus(500).json({ message: 'Something went wrong while kicking off the digest email. Please investigate the server logs.' });
    }

    res.sendStatus(200);
});

router.put('/:agency', requireAdminUser, async (req, res) => {
    // Currently, agencies are seeded into db; only thresholds are mutable.
    const { agency } = req.params;
    const { user } = req.session;

    const allowed = await isUserAuthorized(user, agency);
    if (!allowed) {
        res.sendStatus(403);
        return;
    }

    const { warningThreshold, dangerThreshold } = req.body;
    const result = await setAgencyThresholds(agency, warningThreshold, dangerThreshold);
    res.json(result);
});

router.delete('/del/:agency', requireAdminUser, async (req, res) => {
    const { agency } = req.params;
    const { user } = req.session;

    const allowed = isUserAuthorized(user, agency);
    if (!allowed) {
        res.sendStatus(403);
        return;
    }

    const {
        parent, name, abbreviation, warningThreshold, dangerThreshold,
    } = req.body;
    const result = await deleteAgency(agency, parent, name, abbreviation, warningThreshold, dangerThreshold);
    res.json(result);
});

router.put('/name/:agency', requireAdminUser, async (req, res) => {
    const { agency } = req.params;
    const { user } = req.session;

    const allowed = await isUserAuthorized(user, agency);
    if (!allowed) {
        res.sendStatus(403);
        return;
    }
    const { name } = req.body;
    const result = await setAgencyName(agency, name);
    res.json(result);
});

router.put('/abbr/:agency', requireAdminUser, async (req, res) => {
    const { user } = req.session;
    const { agency } = req.params;
    const { abbreviation } = req.body;
    const allowed = await isUserAuthorized(user, agency);
    if (!allowed) {
        res.sendStatus(403);
        return;
    }
    const result = await setAgencyAbbr(agency, abbreviation);
    res.json(result);
});

router.put('/code/:agency', requireAdminUser, async (req, res) => {
    const { user } = req.session;
    const { agency } = req.params;
    const { code } = req.body;
    const allowed = await isUserAuthorized(user, agency);
    if (!allowed) {
        res.sendStatus(403);
        return;
    }
    const result = await setAgencyCode(agency, code);
    res.json(result);
});

router.put('/parent/:agency', requireAdminUser, async (req, res) => {
    const { user } = req.session;
    const { agency } = req.params;
    const allowed = await isUserAuthorized(user, agency);
    if (!allowed) {
        res.sendStatus(403);
        return;
    }
    const result = await setAgencyParent(agency, Number(req.body.parentId));
    res.json(result);
});

router.post('/', requireAdminUser, async (req, res) => {
    const { user } = req.session;
    const allowed = await isUserAuthorized(user, req.body.parentId);
    if (!allowed) {
        res.sendStatus(403);
        return;
    }
    const agency = {
        name: req.body.name,
        abbreviation: req.body.abbreviation,
        code: req.body.code,
        parent: Number(req.body.parentId),
        warning_threshold: Number(req.body.warningThreshold),
        danger_threshold: Number(req.body.dangerThreshold),
        tenant_id: user.tenant_id,
    };
    const parentAgency = await getAgency(agency.parent);
    if (!parentAgency) {
        throw new Error(`Agency ${agency.parent} not found`);
    }
    const result = await createAgency(agency, user.id);

    res.json(result);
});

router.post(
    '/import',
    requireAdminUser,
    ensureAsyncContext(multerUpload.single('spreadsheet')),
    async (req, res) => {
        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const rowsList = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
        const ret = await (new AgencyImporter()).import(
            req.session.user,
            rowsList,
        );
        res.status(200).json({ ret, error: null });
    },
);

module.exports = router;
