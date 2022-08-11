const express = require('express');

const router = express.Router({ mergeParams: true });
const { requireAdminUser, requireUser, isPartOfAgency } = require('../lib/access-helpers');
const {
    getAgency, getAgencies, setAgencyThresholds, createAgency, setAgencyName, setAgencyAbbr, setAgencyParent,
    deleteAgency,
} = require('../db');

router.get('/', requireUser, async (req, res) => {
    const { user } = req.session;
    let response;
    if (user.role.name === 'admin') {
        response = await getAgencies(req.session.selectedAgency);
    } else {
        response = await getAgency(req.session.selectedAgency);
    }
    res.json(response);
});

router.put('/:agency', requireAdminUser, async (req, res) => {
    // Currently, agencies are seeded into db; only thresholds are mutable.
    const { agency } = req.params;

    const { warningThreshold, dangerThreshold } = req.body;
    const result = await setAgencyThresholds(agency, warningThreshold, dangerThreshold);
    res.json(result);
});

router.delete('/del/:agency', requireAdminUser, async (req, res) => {
    const { agency } = req.params;

    const {
        parent, name, abbreviation, warningThreshold, dangerThreshold,
    } = req.body;
    const result = await deleteAgency(agency, parent, name, abbreviation, warningThreshold, dangerThreshold);
    res.json(result);
});

router.put('/name/:agency', requireAdminUser, async (req, res) => {
    const { agency } = req.params;

    const { name } = req.body;
    const result = await setAgencyName(agency, name);
    res.json(result);
});

router.put('/abbr/:agency', requireAdminUser, async (req, res) => {
    const { agency } = req.params;

    const { abbreviation } = req.body;
    const result = await setAgencyAbbr(agency, abbreviation);
    res.json(result);
});

router.put('/parent/:agency', requireAdminUser, async (req, res) => {
    const { agency } = req.params;

    const result = await setAgencyParent(agency, Number(req.body.parentId));
    res.json(result);
});

router.post('/', requireAdminUser, async (req, res) => {
    const { user } = req.session;
    if (!isPartOfAgency(user.agency.subagencies, req.body.parentId)) {
        throw new Error(`You dont have access parent agency`);
    }
    const agency = {
        name: req.body.name,
        abbreviation: req.body.abbreviation,
        parent: Number(req.body.parentId),
        warning_threshold: Number(req.body.warningThreshold),
        danger_threshold: Number(req.body.dangerThreshold),
        creator_id: user.id,
    };
    const parentAgency = await getAgency(agency.parent);
    if (!parentAgency) {
        throw new Error(`Agency ${agency.parent} not found`);
    }
    const result = await createAgency(agency);

    res.json(result);
});

module.exports = router;
