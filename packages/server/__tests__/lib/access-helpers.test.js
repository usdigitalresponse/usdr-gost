const { expect } = require('chai');
const sinon = require('sinon');
const { getAdminAuthInfo, isMicrosoftSafeLinksRequest } = require('../../src/lib/access-helpers');
const fixtures = require('../db/seeds/fixtures');

async function expectUnauthorized(request) {
    try {
        await getAdminAuthInfo(request);
    } catch (err) {
        expect(err.message).to.equal('Unauthorized');
    }
}

describe('Acces Helper Module', () => {
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
    context('isMicrosoftSafeLinksRequest', () => {
        it('early-returns if request is from Microsoft Safe Links', async () => {
            const resFake = sinon.fake.returns(true);
            resFake.json = sinon.fake.returns(true);
            const nextFake = sinon.fake.returns(true);
            const requestFake = {
                headers: {
                    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36 Edg/117.0.2045.47 OneOutlook/1.2023.927.100',
                    'x-native-host': 'OneOutlook/1.2023.927.100',
                },
            };
            await isMicrosoftSafeLinksRequest(requestFake, resFake, nextFake);
            expect(resFake.json.calledOnceWith({ message: 'Success' })).to.equal(true);
            expect(nextFake.notCalled).to.equal(true);
        });
        it('proceeds normally if request is not from Microsoft Safe Links', async () => {
            const resFake = sinon.fake.returns(true);
            resFake.json = sinon.fake.returns(true);
            const nextFake = sinon.fake.returns(true);
            const requestFake = {
                headers: {
                    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36 Edg/117.0.2045.47 NotOutlook/1.2023.927.100',
                    'x-native-host': 'NotOutlook/1.2023.927.100',
                },
            };
            await isMicrosoftSafeLinksRequest(requestFake, resFake, nextFake);
            expect(resFake.json.notCalled).to.equal(true);
            expect(nextFake.calledOnce).to.equal(true);
        });
    });
});
