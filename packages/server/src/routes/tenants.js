const express = require('express');

const router = express.Router({ mergeParams: true });
const { requireAdminUser, requireUser } = require('../lib/access-helpers');
const {
    getTenant, createTenant, setTenantDisplayName,
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
    if (!req.body.name || !req.body.agency_id) {
        res.status(400).send('Tenant name and agency ID is required');
        return;
    }

    try {
        const tenant = {
            display_name: req.body.name,
            main_agency_id: req.body.agency_id,
        };

        const result = await createTenant(tenant);
        res.json({ tenant: result });
    } catch (e) {
        if (e.message.match(/violates unique constraint/)) {
            console.log(e.message);
            res.status(400).send('Tenant with that name already exists');
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
