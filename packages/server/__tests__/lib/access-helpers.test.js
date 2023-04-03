const { expect } = require('chai');
const { getAdminAuthInfo } = require('../../src/lib/access-helpers');
const db = require('../../src/db');
const fixtures = require('../db/seeds/fixtures');

async function expectUnauthorized(request) {
    try {
        await getAdminAuthInfo(request);
    } catch (err) {
        expect(err.message).to.equal('Unauthorized');
    }
}

describe('Acces Helper Module', () => {
    before(async () => {
        await fixtures.seed(db.knex);
    });

    after(async () => {
        await db.knex.destroy();
    });
    context('getAdminAuthInfo', () => {
        it('throws error if no user ID exists in signed cookie', async () => {
            const requestFake = {
                signedCookies: {
                    userId: null,
                },
            };
            await expectUnauthorized(requestFake);
        });
        it('throws error if no user is found', async () => {
            const requestFake = {
                signedCookies: {
                    userId: 123456,
                },
            };
            await expectUnauthorized(requestFake);
        });
        it('throws error if found user is not an admin', async () => {
            const requestFake = {
                signedCookies: {
                    userId: fixtures.users.staffUser.id,
                },
            };
            await expectUnauthorized(requestFake);
        });
        it('throws error if requestedAgency is not part of user.tenant_id', async () => {
            const requestFake = {
                signedCookies: {
                    userId: fixtures.users.adminUser.id,
                },
                params: {
                    organizationId: fixtures.agencies.fleetServices.id,
                },
            };
            await expectUnauthorized(requestFake);
        });
        it('succeeds for admin user without any organization passed in', async () => {
            const requestFake = {
                signedCookies: {
                    userId: fixtures.users.adminUser.id,
                },
                params: {
                    organizationId: null,
                },
            };
            const result = await getAdminAuthInfo(requestFake);

            expect(Object.keys(result)[0]).to.equal('user');
            expect(result.user.id).to.equal(fixtures.users.adminUser.id);
            expect(Object.keys(result)[1]).to.equal('selectedAgency');
            expect(result.selectedAgency).to.equal(fixtures.agencies.accountancy.id);
        });
        it('succeeds for admin user with a valid organization passed in', async () => {
            const requestFake = {
                signedCookies: {
                    userId: fixtures.users.adminUser.id,
                },
                params: {
                    organizationId: fixtures.agencies.subAccountancy.id,
                },
            };
            const result = await getAdminAuthInfo(requestFake);

            expect(Object.keys(result)[0]).to.equal('user');
            expect(result.user.id).to.equal(fixtures.users.adminUser.id);
            expect(Object.keys(result)[1]).to.equal('selectedAgency');
            expect(result.selectedAgency).to.equal(fixtures.agencies.subAccountancy.id);
        });
    });
});
