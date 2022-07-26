const fetch = require('node-fetch');

require('dotenv').config();

const knex = require('knex')({
    client: 'pg',
    connection: process.env.POSTGRES_TEST_URL || 'postgresql://localhost:5432/usdr_grants_test',
});

async function getSessionCookie(email) {
    // POSTing an email address generates a passcode.
    const resp = await fetch(`${process.env.API_DOMAIN}/api/sessions`, {
        method: 'POST',
        body: JSON.stringify({ email }),
        headers: { 'Content-Type': 'application/json' },
    });
    if (resp.status !== 200 || !(await resp.json()).success) {
        throw new Error(`test called getSessionCookie for invalid user ${email}, are they in seeds/dev/ref/users.js?`);
    }

    // Get the new passcode directly from PostgresQL.
    const query = `SELECT created_at, passcode
              FROM access_tokens
              ORDER BY created_at DESC
              LIMIT 1
            ;`;
    const result = await knex.raw(query);
    const { passcode } = result.rows[0];

    // Use the passcode to generate a sessionID ...
    const response = await fetch(`${process.env.API_DOMAIN}/api/sessions/?passcode=${passcode}`, { redirect: 'manual' });
    // ... and the resulting cookie can be used to authorize requests.
    return response.headers.raw()['set-cookie'];
}

function getEndpoint({ agencyId, url }) {
    return `${process.env.API_DOMAIN}/api/organizations/${agencyId}${url}`;
}

function fetchApi(url, agencyId, fetchOptions) {
    return fetch(getEndpoint({ agencyId, url }), fetchOptions);
}

module.exports = {
    getSessionCookie,
    fetchApi,
    knex,
};
