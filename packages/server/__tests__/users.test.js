/* global context */
/* eslint-disable func-names  */
/* eslint-disable no-use-before-define */

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
            const err = await resetDB();
            expect(err).to.equal(null);
        });
        it('Start the server', async () => {
            // eslint-disable-next-line global-require
            server = await require('../src/index.js');
        });
        it('Log in and get the cookie', async function () {
            this.timeout(3000);

            let response = await fetch('http://localhost:3000/api/sessions',
                {
                    method: 'POST',
                    body: JSON.stringify({ email: 'michael@stanford.cc' }),
                    headers: { 'Content-Type': 'application/json' },
                });
            // const data = await response.json();
            // console.log(response.status, response.statusText);

            let query = `SELECT created_at, passcode
              FROM access_tokens
              ORDER BY created_at DESC
              LIMIT 1
            ;`;
            let result = await knex.raw(query);
            const { passcode } = result.rows[0];
            // console.log(`passcode is ${passcode}`);

            console.log('GET /api/session with passcode');
            response = await fetch(
                `http://localhost:3000/api/sessions/?passcode=${passcode}`,
            );
            // console.dir(response.headers);
            // console.dir(response.getHeaders()['set-cookie']);
            // console.log(response.status, response.statusText);

            query = `SELECT * FROM test_cookie;`;
            result = await knex.raw(query);
            cookie = result.rows[0].cookie;
            // console.log(`cookie is ${cookie}`);

            console.log('GET /api/session with cookie');
            response = await fetch(
                `http://localhost:3000/api/sessions/`,
                {
                    method: 'GET',
                    headers: { Cookie: cookie },
                },
            );
            console.dir(response.statusText);
            // console.dir(await response.json());
        });
        it('Verifies user organization', async () => {
        });
        it('Verifies user sub-organization', async () => {
        });
        it('Rejects user super-organization', async () => {
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
