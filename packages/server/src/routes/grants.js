const express = require('express');

const router = express.Router();
const db = require('../db');
const pdf = require('../lib/pdf');
const { requireUser } = require('../lib/access-helpers');

router.get('/', requireUser, async (req, res) => {
    let agencyCriteria;
    // if we want interested, assigned, grants for a user, do not filter by eligibility or keywords
    if (!req.query.interestedByMe || !req.query.assignedToAgency) {
        agencyCriteria = await db.getAgencyCriteriaForUserId(req.signedCookies.userId);
    }
    const grants = await db.getGrants({
        ...req.query,
        filters: {
            agencyCriteria,
            interestedByUser: req.query.interestedByMe ? req.signedCookies.userId : null,
            assignedToAgency: req.query.assignedToAgency ? req.query.assignedToAgency : null,
        },
    });
    res.json(grants);
});

router.put('/:grantId/view/:agencyId', requireUser, async (req, res) => {
    const { agencyId, grantId } = req.params;
    const user = await db.getUser(req.signedCookies.userId);
    if (!user.agency.subagencies.includes(Number(agencyId))) {
        res.sendStatus(403);
        return;
    }
    await db.markGrantAsViewed({ grantId, agencyId, userId: user.id });
    res.json({});
});

router.get('/:grantId/assign/agencies', requireUser, async (req, res) => {
    const { grantId } = req.params;
    let agencies = [];
    if (req.query.agency) {
        agencies.push(req.query.agency);
    } else {
        const user = await db.getUser(req.signedCookies.userId);
        agencies = user.agency.subagencies;
    }
    const response = await db.getGrantAssignedAgencies({ grantId, agencies });
    res.json(response);
});

router.put('/:grantId/assign/agencies', requireUser, async (req, res) => {
    const user = await db.getUser(req.signedCookies.userId);
    const { grantId } = req.params;
    const { agencyIds } = req.body;
    if (!agencyIds.every((agencyId) => user.agency.subagencies.includes(agencyId))) {
        res.sendStatus(403);
        return;
    }

    await db.assignGrantsToAgencies({ grantId, agencyIds, userId: user.id });
    res.json({});
});

router.delete('/:grantId/assign/agencies', requireUser, async (req, res) => {
    const user = await db.getUser(req.signedCookies.userId);
    const { grantId } = req.params;
    const { agencyIds } = req.body;
    if (!agencyIds.every((agencyId) => user.agency.subagencies.includes(agencyId))) {
        res.sendStatus(403);
        return;
    }

    await db.unassignAgenciesToGrant({ grantId, agencyIds, userId: user.id });
    res.json({});
});

router.get('/:grantId/interested', requireUser, async (req, res) => {
    const { grantId } = req.params;
    let agencies = [];
    if (req.query.agency) {
        agencies.push(req.query.agency);
    } else {
        const user = await db.getUser(req.signedCookies.userId);
        agencies = user.agency.subagencies;
    }
    const interestedAgencies = await db.getInterestedAgencies({ grantIds: [grantId], agencies });
    res.json(interestedAgencies);
});

router.put('/:grantId/interested/:agencyId', requireUser, async (req, res) => {
    const user = await db.getUser(req.signedCookies.userId);
    const { agencyId, grantId } = req.params;
    let interestedCode = null;
    if (req.body && req.body.interestedCode) {
        interestedCode = req.body.interestedCode;
    }

    if (!user.agency.subagencies.includes(Number(agencyId))) {
        res.sendStatus(403);
        return;
    }

    await db.markGrantAsInterested({
        grantId,
        agencyId,
        userId: user.id,
        interestedCode,
    });

    const interestedAgencies = await db.getInterestedAgencies({ grantIds: [grantId], agencies: [agencyId] });
    res.json(interestedAgencies);
});

const formFields = {
    nevada_spoc: {
        PDFTextField: {
            'Name of Person Requesting SPoC': 'name',
            Email: 'email',
            'NoFO #': 'grant_number',
            'Title of Federal Program': 'title',
            CFDA: 'cfda_list',
            'Application amount': '',
            'Funding Agency': 'agencyName',
            // 'Date of award or start of project': '',
            // 'Date due': '',
            // 'Date full application is due': '',
            'Max amount allowed for applications': 'award_ceiling',
            // 'State Application Identification #': '',
            // Summary: '',
        },
    },
};

// eslint-disable-next-line consistent-return
router.get('/:grantId/form/:formName', requireUser, async (req, res) => {
    if (req.params.formName !== 'nevada_spoc') {
        return res.status(400);
    }
    const user = await db.getUser(req.signedCookies.userId);
    const grant = await db.getGrant({ grantId: req.params.grantId });
    if (!grant) {
        return res.status(404);
    }
    if (grant.raw_body) {
        try {
            const rawBody = JSON.parse(grant.raw_body);
            grant.agencyName = rawBody && rawBody.synopsis ? rawBody.synopsis.agencyName : '';
        } catch (e) {
            console.log('failed to parse grant raw_body');
        }
    }
    const filePath = await pdf.fillPdf(`${req.params.formName}.pdf`, formFields[req.params.formName], {
        ...user,
        ...grant,
    });
    res.json({ filePath: `${process.env.API_DOMAIN}${filePath}` });
});

module.exports = router;
