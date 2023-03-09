const { AsyncLocalStorage } = require('node:async_hooks');

const { invariant } = require('ts-invariant');

const requestStorage = new AsyncLocalStorage();

/**
 * An express middleware. Captures the request in AsyncLocalStorage for later
 * retrieval.
 */
function requestProviderMiddleware(req, res, next) {
    requestStorage.run(req, next);
}

/**
 * Get the request object currently being handled by express.
 * @returns {Request}
 */
function useRequest() {
    return requestStorage.getStore();
}

function useSession() {
    const { session } = useRequest();
    invariant(session != null, 'You called useSession, but a session was not available. Consider specifying requireUser on the affected route.');
    return session;
}

function useUser() {
    const { user } = useSession();
    invariant(user != null, 'You called useUser, but a user was not found. Consider specifying requireUser on the affected route.');
    return user;
}

/** A shortcut helper to get at tenant_id directly */
function useTenantId() {
    const tenantId = useUser().tenant_id;
    invariant(tenantId != null, 'You called useTenantId, but a tenantId was not found.');
    return tenantId;
}

module.exports = {
    requestProviderMiddleware,
    useRequest,
    useUser,
    useTenantId,
};

// NOTE: This file was copied from src/server/use-request.js (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z
