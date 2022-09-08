require('dotenv').config();

const _ = require('lodash');
const { expect } = require('chai');
const fetch = require('node-fetch');
const { URLSearchParams } = require('url');
const { validatePostLoginRedirectPath } = require('../../src/lib/redirect_validation');
const { getTestDomain } = require('./utils');
const knex = require('../../src/db/connection');

describe('/api/sessions', () => {
    context('post-login redirects', () => {
        it('validates redirect urls correctly', () => {
            const tests = {
                '': false,
                _: false,
                'https://usdigitalresponse.org/': false,
                'usdigitalresponse.org': false,
                '/api/sessions': false,
                '/': true,
                '#': true,
                '#/grants': true,
                '/arpa_reporter/uploads': true,
            };

            expect(validatePostLoginRedirectPath(null)).to.equal(null);
            expect(validatePostLoginRedirectPath(undefined)).to.equal(null);

            _.forEach(tests, (valid, url) => {
                expect(validatePostLoginRedirectPath(url)).to.equal(valid ? url : null);
            });
        });

        async function testLogin(initBody = {}) {
            const email = 'mindy@usdigitalresponse.org';
            const resp1 = await fetch(`${getTestDomain()}/api/sessions`, {
                method: 'POST',
                body: JSON.stringify({ email }),
                headers: { 'Content-Type': 'application/json' },
            });
            const { success } = await resp1.json();

            expect(resp1.status).to.equal(200);
            expect(resp1.ok).to.equal(true);
            expect(success).to.equal(true);

            const tokenRows = await knex('access_tokens')
                .select(['created_at', 'passcode'])
                .orderBy('created_at', 'desc')
                .limit(1);
            const { passcode } = tokenRows[0];

            expect(passcode).to.not.be.null;

            const params = new URLSearchParams();
            params.set('passcode', passcode);
            _.forEach(initBody, (v, k) => params.set(k, v));
            const resp2 = await fetch(
                `${getTestDomain()}/api/sessions/init`,
                { method: 'POST', body: params, redirect: 'manual' },
            );

            expect(resp2.ok).to.equal(false);
            expect(resp2.status).to.equal(302);

            const redirectUrl = resp2.headers.get('Location');
            return { redirectUrl };
        }

        it('redirects to valid redirect_to', async () => {
            const redirect_to = '#/grants';
            const { redirectUrl } = await testLogin({ redirect_to });
            expect(redirectUrl).to.have.string(redirect_to);
        });

        it('doesn\'t redirect to invalid redirect_to', async () => {
            const redirect_to = '/api/sessions';
            const { redirectUrl } = await testLogin({ redirect_to });
            expect(redirectUrl).to.not.have.string(redirect_to);
        });
    });

    // TODO: probably should have some tests of main login flow
});
