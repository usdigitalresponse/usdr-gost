const express = require('express');

const router = express.Router({ mergeParams: true });
const { requireAdminUser, requireUser } = require('../lib/access-helpers');
const {
    getTenant, setTenantDisplayName, knex,
} = require('../db');
const { createTenant, validateCreateTenantOptions } = require('../db/tenant_creation');

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
    // TODO: access control

    const result = await knex.transaction(async (trns) => {
        const options = req.body;
        const valid = await validateCreateTenantOptions(options, trns);
        if (valid !== true) {
            res.status(400).json({ error: valid });
            return null;
        }

        return createTenant(options, trns);
    });

    res.json(result);
});

router.put('/:tenant', requireAdminUser, async (req, res) => {
    // Currently, tenants are seeded into db; only display name is mutable.
    const { tenant } = req.params;
    const { displayName } = req.body;
    const result = await setTenantDisplayName(tenant, displayName);
    res.json(result);
});

module.exports = router;
