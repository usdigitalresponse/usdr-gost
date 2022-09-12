const { AsyncResource } = require('node:async_hooks')

/**
 * Ensure that an express middleware respects async local storage context.
 *
 * Accepts an express middleware and returns a copy of that middleware with the
 * next() call explicitly bound to the current AsyncResource context.
 *
 * When working with native promises or async/await syntax, Node can
 * automatically forward any existing async resource to nested async or promise
 * invocations. However, when working with nested callback-passing patterns
 * (such as occurs in an express middleware stack) Node cannot know whether the
 * function being passed around should be bound to the current resource.
 *
 * Express may update their plugin architecture to resolve this in a future
 * version. Middleware developers can also update their implementations to
 * ensure backward-compatible support for AsyncLocalStorage. This function
 * allows us to work around the issue for current versions of express and
 * plugins that have not yet been updated.
 *
 * @example
 * router.post(
 *   '/upload',
 *   ensureAsyncContext(asyncMiddleware),
 *   async (req, res, next) => {
 *     // ...
 *   },
 * );
 */
function ensureAsyncContext (middleware) {
  return (req, res, next) => middleware(req, res, AsyncResource.bind(next))
}

module.exports = {
  ensureAsyncContext
}

// NOTE: This file was copied from src/server/lib/ensure-async-context.js (git @ 26f71a0d6d) in the arpa-reporter repo on 2022-09-12T21:06:59.476Z
