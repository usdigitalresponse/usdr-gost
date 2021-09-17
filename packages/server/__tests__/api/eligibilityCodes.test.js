// const { expect } = require('chai');
// const fetch = require('node-fetch');
// const { getSessionCookie } = require('./utils');
// require('dotenv').config();

describe('`/api/eligibility-codes` endpoint', () => {
    context('GET /api/eligibility-codes', () => {
        context('by a user with admin role', () => {
            it('lists eligibility codes of the user\'s own agency and its subagencies');
            it('lists eligibility codes of a subagency of the user\'s own agency and that subagency\'s subagencies');
            it('is forbidden for an agency outside the user\'s hierarchy');
        });
        context('by a user with staff role', () => {
            it('lists eligibility codes of the user\'s own agency');
            it('is forbidden for a subagency of the user\'s own agency');
            it('is forbidden for an agency outside the user\'s hierarchy');
        });
    });
    context('PUT /api/eligibility-codes/:code/enable/:value', () => {
        context('by a user with admin role', () => {
            it('updates an eligibility code of the user\'s own agency');
            it('updates an eligibility code of a subagency of the user\'s own agency');
            it('is forbidden for agencies outside the user\'s hierarchy');
        });
        context('by a user with staff role', () => {
            it('is forbidden for any agency (even the user\'s own agency)');
        });
    });
});
