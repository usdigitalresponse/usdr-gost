const express = require('express');

const router = express.Router({ mergeParams: true });
const { requireUSDRSuperAdminUser } = require('../lib/access-helpers');
const {
    getTenants, setTenantDisplayName, knex,
} = require('../db');
const { createTenant, validateCreateTenantOptions } = require('../db/tenant_creation');

router.get('/', requireUSDRSuperAdminUser, async (req, res) => {
    const allTenants = await getTenants();
    res.json(allTenants);
});

router.post('/', requireUSDRSuperAdminUser, async (req, res) => {
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

router.put('/:tenantId', requireUSDRSuperAdminUser, async (req, res) => {
    // Only display name is mutable after creation.
    const { tenantId } = req.params;
    const { displayName } = req.body;
    const result = await setTenantDisplayName(tenantId, displayName);
    res.json(result);
});

module.exports = router;
