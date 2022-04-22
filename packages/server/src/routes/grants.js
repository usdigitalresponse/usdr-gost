const express = require('express');

const router = express.Router({ mergeParams: true });
// TODO: why is this necessary?
/* eslint-disable import/no-unresolved */
const { stringify: csvStringify } = require('csv-stringify/sync');
const db = require('../db');
const pdf = require('../lib/pdf');
const { requireUser, isPartOfAgency } = require('../lib/access-helpers');

/**
 * Based on arguments passed, return the list of agencies appropiate for this request. This
 * list agency will be used by the query to perform filtering based on user agency access.
 * @param {Number} selectedAgency agency id
 * @param {Object} user User record
 * @param {Object} opts
 * @param {Boolean} opts.filterByMainAgency - If true, it will return a list of ids
 * for all agencies from the main agency.
 * @returns {String[]} array of agency ids
 */
async function getAgencyForUser(selectedAgency, user, { filterByMainAgency } = {}) {
    let agencies = [];
    if (selectedAgency === user.agency_id) {
        agencies = user.agency.subagencies;
    } if (filterByMainAgency && user.agency.main_agency_id >= 0) {
        // Get all agencies from the main agency. Usually the agency of the organization,
        // in other words the root parent agency (for example nevada agency)
        agencies = await db.getAgencies(user.agency.main_agency_id);
    } else {
        agencies = await db.getAgencies(selectedAgency);
    }
    return agencies.map((s) => s.id);
}

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
    let agencyCriteria;
    // if we want interested, assigned, grants for a user, do not filter by eligibility or keywords
    if (!req.query.interestedByMe && !req.query.assignedToAgency) {
        agencyCriteria = await db.getAgencyCriteriaForAgency(req.session.selectedAgency);
    }
    const { selectedAgency, user } = req.session;
    const agencies = await getAgencyForUser(selectedAgency, user, { filterByMainAgency: true });
    const grants = await db.getGrants({
        ...req.query,
        agencies,
        filters: {
            agencyCriteria,
            interestedByUser: req.query.interestedByMe ? req.signedCookies.userId : null,
            assignedToAgency: req.query.assignedToAgency ? req.query.assignedToAgency : null,
        },
    });
    res.json(grants);
});

const MAX_CSV_EXPORT_ROWS = 100000;
router.get('/exportCSV', requireUser, async (req, res) => {
    // First load the grants. This logic is intentionally identical to the endpoint above that
    // serves the grants table UI, except there is no pagination.
    let agencyCriteria;
    // if we want interested, assigned, grants for a user, do not filter by eligibility or keywords
    if (!req.query.interestedByMe && !req.query.assignedToAgency) {
        agencyCriteria = await db.getAgencyCriteriaForAgency(req.session.selectedAgency);
    }
    const { selectedAgency, user } = req.session;
    const agencies = await getAgencyForUser(selectedAgency, user, { filterByMainAgency: true });
    const { data, pagination } = await db.getGrants({
        ...req.query,
        currentPage: 1,
        perPage: MAX_CSV_EXPORT_ROWS,
        agencies,
        filters: {
            agencyCriteria,
            interestedByUser: req.query.interestedByMe ? req.signedCookies.userId : null,
            assignedToAgency: req.query.assignedToAgency ? req.query.assignedToAgency : null,
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
        open_date: new Date(grant.open_date).toLocaleDateString('en-US'),
        close_date: new Date(grant.close_date).toLocaleDateString('en-US'),
        created_at: new Date(grant.created_at).toLocaleString(),
        updated_at: new Date(grant.updated_at).toLocaleString(),
        award_floor: getAwardFloor(grant),
        url: `https://www.grants.gov/web/grants/view-opportunity.html?oppId=${grant.grant_id}`,
    }));
    if (pagination.total > data.length) {
        formattedData.push({
            title: `Error: only ${MAX_CSV_EXPORT_ROWS} rows supported for CSV export, but there `
            + `are ${pagination.total} total.`,
        });
    }
    const csv = csvStringify(formattedData, {
        header: true,
        columns: [
            // Labels and ordering intended to match the columns from
            // client/src/components/GrantsTable.vue
            { key: 'grant_id', header: 'Grant Id' },
            { key: 'grant_number', header: 'Grant Number' },
            { key: 'title', header: 'Title' },
            { key: 'viewed_by', header: 'Viewed By' },
            { key: 'interested_agencies', header: 'Interested Agencies' },
            { key: 'agency_code', header: 'Agency Code' },
            { key: 'cost_sharing', header: 'Cost Sharing' },
            { key: 'open_date', header: 'Posted Date' },
            { key: 'close_date', header: 'Close Date' },
            { key: 'opportunity_category', header: 'Opportunity Category' },
            { key: 'opportunity_status', header: 'Status' },
            { key: 'created_at', header: 'Created At' },
            { key: 'updated_at', header: 'Updated At' },
            { key: 'award_ceiling', header: 'Award Ceiling' },
            { key: 'award_floor', header: 'Award Floor' },
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
    if (!isPartOfAgency(user.agency.subagencies, agencyId)) {
        res.sendStatus(403);
        return;
    }
    await db.markGrantAsViewed({ grantId, agencyId, userId: user.id });
    res.json({});
});

router.get('/:grantId/assign/agencies', requireUser, async (req, res) => {
    const { grantId } = req.params;
    const { selectedAgency, user } = req.session;
    const agencies = await getAgencyForUser(selectedAgency, user, { filterByMainAgency: true });
    const response = await db.getGrantAssignedAgencies({ grantId, agencies });
    res.json(response);
});

router.put('/:grantId/assign/agencies', requireUser, async (req, res) => {
    const { user } = req.session;
    const { grantId } = req.params;
    const { agencyIds } = req.body;
    if (!agencyIds.every((agencyId) => isPartOfAgency(user.agency.subagencies, agencyId))) {
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
    if (!agencyIds.every((agencyId) => isPartOfAgency(user.agency.subagencies, agencyId))) {
        res.sendStatus(403);
        return;
    }

    await db.unassignAgenciesToGrant({ grantId, agencyIds, userId: user.id });
    res.json({});
});

router.get('/:grantId/interested', requireUser, async (req, res) => {
    const { grantId } = req.params;
    const { selectedAgency, user } = req.session;
    const agencies = await getAgencyForUser(selectedAgency, user, { filterByMainAgency: true });
    const interestedAgencies = await db.getInterestedAgencies({ grantIds: [grantId], agencies });
    res.json(interestedAgencies);
});

router.put('/:grantId/interested/:agencyId', requireUser, async (req, res) => {
    const { user } = req.session;
    const { agencyId, grantId } = req.params;
    let interestedCode = null;
    if (req.body && req.body.interestedCode) {
        interestedCode = req.body.interestedCode;
    }

    if (!isPartOfAgency(user.agency.subagencies, agencyId)) {
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
    res.json({ filePath: `${process.env.API_DOMAIN}${filePath}` });
});

module.exports = router;
