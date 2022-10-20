const express = require('express');
// eslint-disable-next-line import/no-unresolved
const { stringify: csvStringify } = require('csv-stringify/sync');
const db = require('../db');
const pdf = require('../lib/pdf');
const { requireUser, isUserAuthorized } = require('../lib/access-helpers');

const router = express.Router({ mergeParams: true });

// Award floor field was requested for CSV export but is not stored as a dedicated column,
// so we have to extract it from raw_body
function getAwardFloor(grant) {
    let body;
    try {
        body = JSON.parse(grant.raw_body);
    } catch (err) {
        // Some seeded test data has invalid JSON in raw_body field
        return undefined;
    }

    const floor = parseInt(body.synopsis && body.synopsis.awardFloor, 10);
    if (Number.isNaN(floor)) {
        return undefined;
    }
    return floor;
}

router.get('/', requireUser, async (req, res) => {
    const { selectedAgency, user } = req.session;
    let agencyCriteria;
    // if we want interested, assigned, grants for a user, do not filter by eligibility or keywords
    if (!req.query.interestedByMe && !req.query.assignedToAgency) {
        agencyCriteria = await db.getAgencyCriteriaForAgency(selectedAgency);
    }

    const grants = await db.getGrants({
        ...req.query,
        tenantId: user.tenant_id,
        filters: {
            agencyCriteria,
            interestedByAgency: req.query.interestedByAgency ? selectedAgency : null,
            interestedByUser: req.query.interestedByMe ? req.signedCookies.userId : null,
            assignedToAgency: req.query.assignedToAgency ? req.query.assignedToAgency : null,
            positiveInterest: req.query.positiveInterest ? true : null,
            rejected: req.query.rejected ? true : null,
        },
        orderBy: req.query.orderBy,
        ascending: req.query.ascending,
    });
    res.json(grants);
});

// get a single grant details
router.get('/:grantId/grantDetails', requireUser, async (req, res) => {
    const { grantId } = req.params;
    const { user } = req.session;
    const response = await db.getSingleGrantDetails({ grantId, tenantId: user.tenant_id });
    res.json(response);
});

router.get('/closestGrants/:perPage/:currentPage', requireUser, async (req, res) => {
    const { perPage, currentPage } = req.params;
    const rows = await db.getClosestGrants({ agency: req.session.selectedAgency, perPage, currentPage });
    res.json(rows);
});

// For API tests, reduce the limit to 100 -- this is so we can test the logic around the limit
// without the test having to insert 10k rows, which slows down the test.
const MAX_CSV_EXPORT_ROWS = process.env.NODE_ENV !== 'test' ? 10000 : 100;
router.get('/exportCSV', requireUser, async (req, res) => {
    const { selectedAgency, user } = req.session;
    // First load the grants. This logic is intentionally identical to the endpoint above that
    // serves the grants table UI, except there is no pagination.
    let agencyCriteria;
    // if we want interested, assigned, grants for a user, do not filter by eligibility or keywords
    if (!req.query.interestedByMe && !req.query.assignedToAgency) {
        agencyCriteria = await db.getAgencyCriteriaForAgency(selectedAgency);
    }
    const { data, pagination } = await db.getGrants({
        ...req.query,
        currentPage: 1,
        perPage: MAX_CSV_EXPORT_ROWS,
        tenantId: user.tenant_id,
        filters: {
            agencyCriteria,
            interestedByUser: req.query.interestedByMe ? req.signedCookies.userId : null,
            assignedToAgency: req.query.assignedToAgency ? req.query.assignedToAgency : null,
            positiveInterest: req.query.positiveInterest ? true : null,
            rejected: req.query.rejected ? true : null,
        },
    });

    // Generate CSV
    const formattedData = data.map((grant) => ({
        ...grant,
        interested_agencies: grant.interested_agencies
            .map((v) => v.agency_abbreviation)
            .join(', '),
        viewed_by: grant.viewed_by_agencies
            .map((v) => v.agency_abbreviation)
            .join(', '),
        // TODO: how does server timezone affect the rendering of these dates?
        open_date: new Date(grant.open_date).toLocaleDateString('en-US', { timeZone: 'America/New_York' }),
        close_date: new Date(grant.close_date).toLocaleDateString('en-US', { timeZone: 'America/New_York' }),
        award_floor: getAwardFloor(grant),
        url: `https://www.grants.gov/web/grants/view-opportunity.html?oppId=${grant.grant_id}`,
    }));

    if (data.length === 0) {
        // If there are 0 rows, csv-stringify won't even emit the header, resulting in a totally
        // empty file, which is confusing. This adds a single empty row below the header.
        formattedData.push({});
    } else if (pagination.total > data.length) {
        formattedData.push({
            title: `Error: only ${MAX_CSV_EXPORT_ROWS} rows supported for CSV export, but there `
                + `are ${pagination.total} total.`,
        });
    }

    const csv = csvStringify(formattedData, {
        header: true,
        columns: [
            { key: 'grant_number', header: 'Opportunity Number' },
            { key: 'title', header: 'Title' },
            { key: 'viewed_by', header: 'Viewed By' },
            { key: 'interested_agencies', header: 'Interested Agencies' },
            { key: 'opportunity_status', header: 'Status' },
            { key: 'opportunity_category', header: 'Opportunity Category' },
            { key: 'cost_sharing', header: 'Cost Sharing' },
            { key: 'award_floor', header: 'Award Floor' },
            { key: 'award_ceiling', header: 'Award Ceiling' },
            { key: 'open_date', header: 'Posted Date' },
            { key: 'close_date', header: 'Close Date' },
            { key: 'agency_code', header: 'Agency Code' },
            { key: 'grant_id', header: 'Grant Id' },
            { key: 'url', header: 'URL' },
        ],
    });

    // Send to client as a downloadable file.
    const filename = 'grants.csv';
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Length', csv.length);
    res.send(csv);
});

router.put('/:grantId/view/:agencyId', requireUser, async (req, res) => {
    const { agencyId, grantId } = req.params;
    const { user } = req.session;
    const allowed = await isUserAuthorized(user, agencyId);
    if (!allowed) {
        res.sendStatus(403);
        return;
    }
    await db.markGrantAsViewed({ grantId, agencyId, userId: user.id });
    res.json({});
});

router.get('/:grantId/assign/agencies', requireUser, async (req, res) => {
    const { grantId } = req.params;
    const { user } = req.session;
    const response = await db.getGrantAssignedAgencies({ grantId, tenantId: user.tenant_id });
    res.json(response);
});

router.put('/:grantId/assign/agencies', requireUser, async (req, res) => {
    const { user } = req.session;
    const { grantId } = req.params;
    const { agencyIds } = req.body;

    const inSameTenant = await db.inTenant(user.tenant_id, agencyIds);
    if (!inSameTenant) {
        res.sendStatus(403);
        return;
    }

    await db.assignGrantsToAgencies({ grantId, agencyIds, userId: user.id });
    res.json({});
});

router.delete('/:grantId/assign/agencies', requireUser, async (req, res) => {
    const { user } = req.session;
    const { grantId } = req.params;
    const { agencyIds } = req.body;

    const inSameTenant = await db.inTenant(user.tenant_id, agencyIds);
    if (!inSameTenant) {
        res.sendStatus(403);
        return;
    }

    await db.unassignAgenciesToGrant({ grantId, agencyIds, userId: user.id });
    res.json({});
});

router.get('/:grantId/interested', requireUser, async (req, res) => {
    const { grantId } = req.params;
    const { user } = req.session;
    const interestedAgencies = await db.getInterestedAgencies({ grantIds: [grantId], tenantId: user.tenant_id });
    res.json(interestedAgencies);
});

router.get('/grantsInterested/:perPage/:currentPage', requireUser, async (req, res) => {
    const { perPage, currentPage } = req.params;
    const { selectedAgency } = req.session;
    const rows = await db.getGrantsInterested({ perPage, currentPage, agencyId: selectedAgency });
    res.json(rows);
});

router.put('/:grantId/interested/:agencyId', requireUser, async (req, res) => {
    const { user } = req.session;
    const { agencyId, grantId } = req.params;
    let interestedCode = null;
    if (req.body && req.body.interestedCode) {
        interestedCode = req.body.interestedCode;
    }

    const allowed = await isUserAuthorized(user, agencyId);
    if (!allowed) {
        res.sendStatus(403);
        return;
    }

    await db.markGrantAsInterested({
        grantId,
        agencyId,
        userId: user.id,
        interestedCode,
    });

    const interestedAgencies = await db.getInterestedAgencies({ grantIds: [grantId], tenantId: user.tenant_id });
    res.json(interestedAgencies);
});

router.delete('/:grantId/interested/:agencyId', requireUser, async (req, res) => {
    const { user } = req.session;
    const { grantId, agencyId } = req.params;
    const { agencyIds } = req.body;
    // If agencyIds is not empty, use that. Otherwise, use the single agencyId value.
    const submittedAgencyIds = (agencyIds || []).length > 0 ? agencyIds : [agencyId];

    const allowed = await isUserAuthorized(user, ...submittedAgencyIds);
    if (!allowed) {
        res.sendStatus(403);
        return;
    }

    await db.unmarkGrantAsInterested({ grantId, agencyIds: submittedAgencyIds, userId: user.id });
    res.json({});
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
    const { user } = req.session;
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
    res.json({ filePath });
});

module.exports = router;
