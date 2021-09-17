// const { expect } = require('chai');
// const fetch = require('node-fetch');
// const { getSessionCookie } = require('./utils');
// require('dotenv').config();

describe('`/api/keywords` endpoint', () => {
    context('GET /keywords', () => {
        context('by a user with admin role', () => {
            it('lists keywords of the user\'s own agency');
            it('lists keywords of a subagency of the user\'s own agency');
            it('is forbidden for an agency outside the user\'s hierarchy');
        });
        context('by a user with staff role', () => {
            it('lists keywords of the user\'s own agency');
            it('is forbidden for a subagency of the user\'s own agency');
            it('is forbidden for an agency outside the user\'s hierarchy');
        });
    });
    context('POST /keywords', () => {
        context('by a user with admin role', () => {
            it('creates a keyword for the user\'s own agency');
            it('creates a keyword for a subagency of the user\'s own agency');
            it('is forbidden for an agency outside the user\'s hierarchy');
        });
        context('by a user with staff role', () => {
            it('is forbidden for any agency (even the user\'s own)');
        });
    });
    context('DELETE /keywords/:id', () => {
        context('by a user with admin role', () => {
            it('deletes a keyword of the user\'s own agency');
            it('deletes a keyword of a subagency of the user\'s own agency');
            it('is forbidden for keywords of an agency outside the user\'s hierarchy');
        });
        context('by a user with staff role', () => {
            it('is forbidden for any keyword (even of the user\'s own agency)');
        });
    });
});
