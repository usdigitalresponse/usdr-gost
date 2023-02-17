const express = require('express');
const { requireAdminUser, requireUser } = require('../../lib/access-helpers');

const router = express.Router();
const {
    agencies,
    createAgency,
    updateAgency,
    agencyById,
} = require('../../db/arpa_reporter_db_shims/agencies');

router.get('/', requireUser, (req, res) => {
    agencies().then((ags) => res.json({ agencies: ags }));
});

async function validateAgency(agency) {
    if (!agency.name) {
        throw new Error('Agency requires a name');
    }
    if (!agency.code) {
        throw new Error('Agency requires a code');
    }
}

router.post('/', requireAdminUser, async (req, res) => {
    const agencyInfo = req.body.agency;

    try {
        await validateAgency(agencyInfo);
    } catch (e) {
        res.status(400).json({ error: e.message });
        return;
    }

    try {
        if (agencyInfo.id) {
            const existingAgency = await agencyById(agencyInfo.id);
            if (!existingAgency || existingAgency.tenant_id !== req.session.user.tenant_id) {
                res.status(404).json({ error: 'invalid agency' });
                return;
            }

            const agency = await updateAgency(agencyInfo);
            res.json({ agency });
        } else {
            const agency = await createAgency(agencyInfo);
            res.json({ agency });
        }
    } catch (e) {
        if (e.message.match(/violates unique constraint/)) {
            res.status(400).json({ error: 'Agency with that code already exists' });
        } else {
            res.status(500).json({ error: e.message });
        }
    }
});

module.exports = router;

// NOTE: This file was copied from src/server/routes/agencies.js (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z
