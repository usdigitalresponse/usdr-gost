// const { expect } = require('chai');
// const fetch = require('node-fetch');
// const { getSessionCookie } = require('./utils');
// require('dotenv').config();

describe('`/api/agencies` endpoint', () => {
    context('GET /agencies', () => {
        context('by a user with admin role', () => {
            it('lists the user\'s own agency and its subagencies');
            it('lists a subagency of the user\'s own agency and that subagency\'s subagencies');
            it('is forbidden for an agency outside the user\'s hierarchy');
        });
        context('by a user with staff role', () => {
            it('lists the user\'s own agency');
            it('is forbidden for a subagency of the user\'s own agency');
            it('is forbidden for an agency outside the user\'s hierarchy');
        });
    });
    context('PUT /agencies/:id', () => {
        context('by a user with admin role', () => {
            it('updates the user\'s own agency');
            it('updates a subagency of the user\'s own agency');
            it('is forbidden for agencies outside the user\'s hierarchy');
        });
        context('by a user with staff role', () => {
            it('is forbidden for any agency (even the user\'s own agency)');
        });
    });
});
