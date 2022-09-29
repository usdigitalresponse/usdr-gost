require('dotenv').config();

const fetch = require('node-fetch');
const express = require('express');
const supertest = require('supertest');
const { sign: signCookie } = require('cookie-signature');

const { knex } = require('../../src/db');
const { configureApp } = require('../../src/configure');

// deprecated, use makeTestServer.fetchApi instead
function getTestDomain() {
    const { PORT = 3000 } = process.env;
    return `http://localhost:${PORT}`;
}

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

// deprecated, use makeTestServer.fetchApi instead
function getEndpoint({ agencyId, url }) {
    return `${getTestDomain()}/api/organizations/${agencyId}${url}`;
}

// deprecated, use makeTestServer.fetchApi instead
function fetchApi(url, agencyId, fetchOptions) {
    return fetch(getEndpoint({ agencyId, url }), fetchOptions);
}

async function makeTestServer(configureAppFn = configureApp) {
    const app = express();
    configureAppFn(app);

    let onListening;
    const listeningPromise = new Promise((resolve) => {
        onListening = resolve;
    });
    const server = app.listen(0 /* chooses a random available port */, onListening);
    await listeningPromise;

    const { port } = server.address();
    const tester = supertest(server);

    if ('stop' in tester) {
        throw new Error('makeTestServer adds a stop method and expects Supertest not to have its own');
    }

    if ('fetch' in tester) {
        throw new Error('makeTestServer adds a fetch method and expects Supertest not to have its own');
    }

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

            return fetch(`http://localhost:${port}${url}`, options);
        },
        fetchApi: (url, agencyId, fetchOptions) => extraProps.fetch(`/api/organizations/${agencyId}${url}`, fetchOptions),
    };

    Object.keys(extraProps).forEach((prop) => {
        if (prop in tester) {
            throw new Error(`makeTestServer adds a ${prop} method and expects Supertest not to have its own`);
        }
    });

    // We wrap Supertest's object in a proxy to add some properties.
    // TODO: can we just Object.assign?
    return new Proxy(tester, {
        get(target, prop, receiver) {
            if (prop in extraProps) {
                return extraProps[prop];
            }

            return Reflect.get(target, prop, receiver);
        },
    });
}

module.exports = {
    getTestDomain,
    getSessionCookie,
    fetchApi,
    makeTestServer,
    knex,
};
