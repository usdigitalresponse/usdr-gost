require('dotenv').config();

const fetch = require('node-fetch');
const express = require('express');
const supertest = require('supertest');
const { sign: signCookie } = require('cookie-signature');

const { knex } = require('../../src/db');
const { configureApp } = require('../../src/configure');

async function getSessionCookie(userIdOrEmail) {
    if (typeof userIdOrEmail === 'string') {
        const email = userIdOrEmail;
        const user = await knex('users')
            .select('*')
            .where('email', email)
            .then((rows) => rows[0]);
        if (!user) {
            throw new Error('withSessionCookie got nonexistent email');
        }
        userIdOrEmail = user.id;
    }

    const userId = userIdOrEmail;

    // NOTE: the structure of this cookie value comes from Express itself, see implementation of
    // Response.cookie() and the cookie-parser middleware
    return `userId=s:${signCookie(String(userId), process.env.COOKIE_SECRET)}`;
}

// This returns a Supertest object that can be used to test API routes.
//
// There are two ways to interact with it:
//  1. Use Supertest API:
//       await testServer.get('/api/organizations/0/users').expect(200);
//  2. Use fetch/fetchApi helpers:
//       const json = await testServer.fetchApi('/users', 0, {}).then(resp => resp.json());
//       expect(json.length).to.equal(4);
//
// In general, you should call makeTestServer() in a Mocha before hook and call
// testServer.stop() in a Mocha after hook
async function makeTestServer(configureAppFn = configureApp) {
    // Setup Express
    const app = express();
    configureAppFn(app);

    // Start server and wait for listening event
    let onListening;
    const listeningPromise = new Promise((resolve) => {
        onListening = resolve;
    });
    const server = app.listen(0 /* chooses a random available port */, onListening);
    await listeningPromise;

    // Init Supertest and extend with some extra properties
    const tester = supertest(server);
    const extraProps = {
        // Supertest has inconsistent behavior around closing server sockets (autoclose when calling
        // end(), but not when using async/await) -- so instead we manage the server socket ourselves
        // and provide an extra method to close it.
        //
        // Intended use is makeTestServer is called in before/beforeEach and stop is called in
        // after/afterEach
        stop: () => server.close(),

        // Older pre-Supertest GOST tests interact with the server using fetch, so provide drop-in
        // replacements for fetch and the fetchApi convenience method.
        fetch: (url, options) => {
            if (!url.startsWith('/')) {
                throw new Error('expected only relative urls in makeTestServer fetch function');
            }

            const { port } = server.address();
            return fetch(`http://localhost:${port}${url}`, options);
        },
        fetchApi: (url, agencyId, fetchOptions) => extraProps.fetch(`/api/organizations/${agencyId}${url}`, fetchOptions),
    };

    Object.keys(extraProps).forEach((prop) => {
        if (prop in tester) {
            throw new Error(`makeTestServer adds a ${prop} method and expects Supertest not to have its own`);
        }
    });

    Object.assign(tester, extraProps);
    return tester;
}

module.exports = {
    getSessionCookie,
    makeTestServer,
    knex,
};
