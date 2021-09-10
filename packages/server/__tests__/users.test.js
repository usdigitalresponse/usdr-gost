/* eslint-disable func-names  */
/* eslint-disable no-use-before-define */
/* eslint-disable import/no-unresolved */

const usdrAgency = 0;
const nevadaAgency = 384;
// const cedAgency=109;``
const procurementAgency = 113;

const { expect } = require('chai');
// const path = require('path')
const fetch = require('node-fetch');

require('dotenv').config();

const knex = require('knex')({
    client: 'pg',
    connection: process.env.POSTGRES_URL,
});

const resetDB = require('../test.tools/resetdb');

describe('User permissions', () => {
    let server;
    let cookie;
    context('Organization hierarchy', () => {
        it('Reset the database', async function () {
            this.timeout(4000);
            const err = await resetDB({ verbose: false });
            expect(err).to.equal(null);
        });
        it('Start the server', async () => {
            // eslint-disable-next-line global-require
            server = await require('../src/index');
        });
        it('Log in and get the cookie', async () => {
            // this.timeout(3000);

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
        it('Verifies user organization', async () => {
            // POSTing an email address generates a passcode
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
            // POSTing an email address generates a passcode
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
            // POSTing an email address generates a passcode
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
        it('Stop the server', function (done) {
            this.timeout(3000);
            knex.destroy().then(() => {
                server.close((err) => {
                    if (err) {
                        throw (err);
                    }
                    console.log(`Server has stopped.`);
                    done();
                    console.log(`ENABLE_GRANTS_SCRAPER=${process.env.ENABLE_GRANTS_SCRAPER}`);
                    // Not sure why this is needed - we have stopped the
                    // server and stopped Knex, and we set the server
                    // not to scrape in the background...
                    wait(1000).then(() => process.exit(0));
                });
            });
        });
    });
});

async function wait(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}
