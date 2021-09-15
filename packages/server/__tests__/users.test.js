/* eslint-disable func-names  */
/* eslint-disable no-use-before-define */
/* eslint-disable import/no-unresolved */

const usdrAgency = 0;
const nevadaAgency = 384;
const procurementAgency = 113;

const { expect } = require('chai');
const fetch = require('node-fetch');

require('dotenv').config();

const knex = require('knex')({
    client: 'pg',
    connection: process.env.POSTGRES_URL,
});

describe('User permissions', () => {
    let cookie;

    before(async function () {
        this.timeout(4000);

        // POSTing an email address generates a passcode
        let response = await fetch('http://localhost:3000/api/sessions',
            {
                method: 'POST',
                body: JSON.stringify({ email: 'michael@nv.gov' }),
                headers: { 'Content-Type': 'application/json' },
            });

        // get the new passcode directly from PostgresQL
        let query = `SELECT created_at, passcode
              FROM access_tokens
              ORDER BY created_at DESC
              LIMIT 1
            ;`;
        let result = await knex.raw(query);
        const { passcode } = result.rows[0];

        // use the passcode to generate a sessionID
        response = await fetch(
            `http://localhost:3000/api/sessions/?passcode=${passcode}`,
        );

        // read the cookie directly from PostgresQL
        query = `SELECT * FROM test_cookie;`;
        result = await knex.raw(query);
        cookie = result.rows[0].cookie;

        // verify that the cookie works with a GET
        // eslint-disable-next-line no-unused-vars
        response = await fetch(
            `http://localhost:3000/api/sessions/`,
            {
                headers: { Cookie: cookie },
            },
        );
        expect((await response.json()).user.email)
            .to.equal('michael@nv.gov');
    });

    context('Organization hierarchy', () => {
        it('Verifies user organization', async () => {
            const response = await fetch('http://localhost:3000/api/users',
                {
                    headers: {
                        'Content-Type': 'application/json',
                        organization: nevadaAgency,
                        Cookie: cookie,
                    },
                });
            // console.dir(response.statusText);
            // console.dir(await response.json(), { depth: 4 });
            expect(response.statusText).to.equal('OK');
            expect((await response.json()).length).to.equal(4);
        });
        it('Verifies user sub-organization', async () => {
            const response = await fetch('http://localhost:3000/api/users',
                {
                    headers: {
                        'Content-Type': 'application/json',
                        organization: procurementAgency,
                        Cookie: cookie,
                    },
                });
            // console.dir(response.statusText);
            // console.dir(await response.json(), { depth: 4 });
            expect(response.statusText).to.equal('OK');
            expect((await response.json()).length).to.equal(5);
        });
        it('Rejects user super-organization', async () => {
            const response = await fetch('http://localhost:3000/api/users',
                {
                    headers: {
                        'Content-Type': 'application/json',
                        organization: usdrAgency,
                        Cookie: cookie,
                    },
                });
            // console.dir(response.statusText);
            expect(response.statusText).to.equal('Forbidden');
        });
    });
});
