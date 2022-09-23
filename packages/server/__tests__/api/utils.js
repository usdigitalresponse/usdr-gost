const fetch = require('node-fetch');
const { URLSearchParams } = require('url');
require('dotenv').config();
const { knex } = require('../../src/db');

function getTestDomain() {
    const { PORT = 3000 } = process.env;
    return `http://localhost:${PORT}`;
}

async function getSessionCookie(email) {
    // generate a passcode
    // POSTing an email address generates a passcode.
    const resp = await fetch(`${getTestDomain()}/api/sessions`, {
        method: 'POST',
        body: JSON.stringify({ email }),
        headers: { 'Content-Type': 'application/json' },
    });
    const respResult = await resp.json();
    if (resp.status !== 200 || !respResult.success) {
        throw new Error(`test called getSessionCookie for invalid user ${email}, are they in seeds/dev/ref/users.js?`);
    }

    // eslint-disable-next-line no-useless-catch
    try {
        // Get the new passcode directly from PostgresQL.
        const query = `SELECT created_at, passcode
                FROM access_tokens
                ORDER BY created_at DESC
                LIMIT 1;`;
        const result = await knex.raw(query);
        const row = result.rows[0];
        const passcode = row?.passcode;

        // Use the passcode to generate a sessionID ...
        const passcodeParam = new URLSearchParams();
        passcodeParam.set('passcode', passcode);
        const response = await fetch(
            `${getTestDomain()}/api/sessions/init`,
            { method: 'POST', body: passcodeParam, redirect: 'manual' },
        );
        const responseHeaders = await response.headers;
        const cookie = responseHeaders.get('set-cookie');
        // console.log('responseHeaders:', JSON.stringify(responseHeaders.raw(), null, 2));

        // ... and the resulting cookie can be used to authorize requests.
        // return responseHeaders.raw()['set-cookie'];
        return cookie;
    } catch (error) {
        throw error;
    }
}

function getEndpoint({ agencyId, url }) {
    return `${getTestDomain()}/api/organizations/${agencyId}${url}`;
}

function fetchApi(url, agencyId, fetchOptions) {
    return fetch(getEndpoint({ agencyId, url }), fetchOptions);
}

module.exports = {
    getTestDomain,
    getSessionCookie,
    fetchApi,
    knex,
};
