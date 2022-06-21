const express = require('express');

const router = express.Router({ mergeParams: true });
// const { requireAdminUser, requireUser } = require('../lib/access-helpers');
const { requireAdminUser } = require('../lib/access-helpers');
const {
    getTenantByMainAgencyId, setTenantDisplayName,
} = require('../db');

router.get('/', requireAdminUser, async (req, res) => {
    // const { user } = req.session;
    const result = await getTenantByMainAgencyId(req.session.selectedAgency);
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
