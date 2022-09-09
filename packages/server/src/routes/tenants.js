const express = require('express');

const router = express.Router({ mergeParams: true });
const { requireAdminUser, requireUser } = require('../lib/access-helpers');
const {
    getTenant, createTenant, setTenantDisplayName, createAgency,
} = require('../db');

router.get('/', requireUser, async (req, res) => {
    const { user } = req.session;
    let response;
    if (user.role.name === 'admin') {
        response = await getTenant(req.session.selectedAgency);
    } else {
        throw new Error(`You dont have access to tenants`);
    }
    res.json(response);
});

router.post('/', async (req, res) => {
    if (!req.body.tenant_name || !req.body.agency_name || !req.body.agency_abbreviation) {
        res.status(400).send('Tenant name, agency name, and agency abbreivation is required');
        return;
    }

    try {
        const agency = {
            name: req.body.agency_name,
            abbreviation: req.body.agency_abbreviation,
            parent: 0,
            warning_threshold: 30,
            danger_threshhold: 15,
        };

        const createdAgency = await createAgency(agency, 15);

        const tenant = {
            display_name: req.body.tenant_name,
        };

        const createdTenant = await createTenant(tenant);

        // _ = await setAgencyTenantId(createdAgency.id, createdTenant.id);

        res.json({ tenant: createdTenant });
    } catch (e) {
        if (e.message.match(/violates unique constraint "agencies_name_unique"/)) {
            console.log(e.message);
            res.status(400).send('Agency with that name already exists');
        }
    }
});

router.put('/:tenant', requireAdminUser, async (req, res) => {
    // Currently, tenants are seeded into db; only display name is mutable.
    const { tenant } = req.params;
    const { displayName } = req.body;
    const result = await setTenantDisplayName(tenant, displayName);
    res.json(result);
});

module.exports = router;
