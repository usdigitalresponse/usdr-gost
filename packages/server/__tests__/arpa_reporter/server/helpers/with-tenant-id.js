const { requestProviderMiddleware } = require('../../../../src/arpa_reporter/use-request');

/**
 * Runs a callback function in the context of an AsyncLocalStorage store
 * containing the supplied tenant_id.
 * @param {string} tenantId
 * @param {Function} callback
 * @returns {Promise}
 * A promise that resolves to the return value of the callback, if any.
 */
async function withTenantId(tenantId, callback) {
    return new Promise((resolve) => {
        requestProviderMiddleware(
            { session: { user: { tenant_id: tenantId } } },
            null,
            () => resolve(callback()),
        );
    });
}

module.exports = {
    withTenantId,
};

// NOTE: This file was copied from tests/server/helpers/with-tenant-id.js (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z
