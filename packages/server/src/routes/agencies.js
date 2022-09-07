const express = require('express');

const router = express.Router({ mergeParams: true });
const { requireAdminUser, requireUser, isUserAuthorized } = require('../lib/access-helpers');
const {
    getAgency,
    getAgencyTree,
    getTenantAgencies,
    setAgencyThresholds,
    createAgency,
    setAgencyName,
    setAgencyAbbr,
    setAgencyParent,
    setAgencyCode,
    deleteAgency,
} = require('../db');

router.get('/', requireUser, async (req, res) => {
    const { user } = req.session;
    const response = await getTenantAgencies(user.tenant_id);
    res.json(response);
});

router.get('/impersonable', requireAdminUser, async (req, res) => {
    const { selectedAgency, user } = req.session;
    const { asAgency } = req.params;
    let agencyId = selectedAgency;

    if (asAgency || asAgency == 0) {
        const allowed = await isUserAuthorized(user, asAgency);
        if (!allowed) {
            return res.status(403);
        }
        agencyId = asAgency;
    }
    const response = await getAgencyTree(agencyId);
    res.json(response);
});

router.put('/:agency', requireAdminUser, async (req, res) => {
    // Currently, agencies are seeded into db; only thresholds are mutable.
    const { agency } = req.params;
    // TODO(mbroussard/bspates): requireAdminUser only checks validity of :organizationId, but we need
    // to check :agency too

    const { warningThreshold, dangerThreshold } = req.body;
    const result = await setAgencyThresholds(agency, warningThreshold, dangerThreshold);
    res.json(result);
});

router.delete('/del/:agency', requireAdminUser, async (req, res) => {
    const { agency } = req.params;
    // TODO(mbroussard/bspates): requireAdminUser only checks validity of :organizationId, but we need
    // to check :agency too

    const {
        parent, name, abbreviation, warningThreshold, dangerThreshold,
    } = req.body;
    const result = await deleteAgency(agency, parent, name, abbreviation, warningThreshold, dangerThreshold);
    res.json(result);
});

router.put('/name/:agency', requireAdminUser, async (req, res) => {
    const { agency } = req.params;
    // TODO(mbroussard/bspates): requireAdminUser only checks validity of :organizationId, but we need
    // to check :agency too

    const { name } = req.body;
    const result = await setAgencyName(agency, name);
    res.json(result);
});

router.put('/abbr/:agency', requireAdminUser, async (req, res) => {
    const { agency } = req.params;
    // TODO(mbroussard/bspates): requireAdminUser only checks validity of :organizationId, but we need
    // to check :agency too

    const { abbreviation } = req.body;
    const result = await setAgencyAbbr(agency, abbreviation);
    res.json(result);
});

router.put('/code/:agency', requireAdminUser, async (req, res) => {
    const { agency } = req.params;
    // TODO(mbroussard/bspates): requireAdminUser only checks validity of :organizationId, but we need
    // to check :agency too

    const { code } = req.body;
    const result = await setAgencyCode(agency, code);
    res.json(result);
});

router.put('/parent/:agency', requireAdminUser, async (req, res) => {
    const { agency } = req.params;

    const result = await setAgencyParent(agency, Number(req.body.parentId));
    res.json(result);
});

router.post('/', requireAdminUser, async (req, res) => {
    const { user } = req.session;
    const allowed = await isUserAuthorized(user, req.body.parentId);
    if (!allowed) {
        throw new Error(`You dont have access parent agency`);
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

module.exports = router;
