const { expect } = require('chai');
const sinon = require('sinon');
const knex = require('../../src/db/connection');
const db = require('../../src/db');
const { TABLES } = require('../../src/db/constants');
const fixtures = require('./seeds/fixtures');
const emailConstants = require('../../src/lib/email/constants');

describe('db', () => {
    before(async () => {
        await fixtures.seed(db.knex);
        // await db.knex.migrate.rollback();
        // await db.knex.raw('DROP DATABASE IF EXISTS usdr_grants_test');
        // await db.knex.raw('CREATE DATABASE usdr_grants_test');
        // await db.knex.migrate.forceFreeMigrationsLock();
        // await db.knex.migrate.latest();
        // await db.knex.seed.run();
    });

    after(async () => {
        await db.knex.destroy();
    });

    context('getGrantsInterested', () => {
        it('gets the most recent interested grant', async () => {
            const rows = await db.getGrantsInterested({ agencyId: fixtures.users.staffUser.agency_id, perPage: 1, currentPage: 1 });
            expect(rows[0]).to.have.property('grant_id').with.lengthOf(6);
            expect(rows[0].grant_id).to.equal(fixtures.grantsInterested.entry2.grant_id);
            // in the grants interested table the grant with the most recent created_at has the grant id of 335255
            expect(rows[0]).to.have.property('grant_id').equal('335255');
        });
        it('gets the two most recent interested grants', async () => {
            // testing pagination
            const rows = await db.getGrantsInterested({ agencyId: fixtures.users.staffUser.agency_id, perPage: 2, currentPage: 1 });
            expect(rows).to.have.lengthOf(2);
            expect(rows.map((r) => r.created_at.getTime())).to.have.all.members([1663117521515, 1659827033570]);
        });
    });
    context('getTotalInterestedGrants', () => {
        it('gets total interested grants count', async () => {
            const result = await db.getTotalInterestedGrants(fixtures.users.staffUser.agency_id);

            expect(result).to.equal(3);
        });
    });

    context('getTotalGrants', () => {
        it('gets total grant count with no parameters', async () => {
            const result = await db.getTotalGrants();
            expect(result).to.equal('4');
        });

        it('gets total grant count matching agency criteria', async () => {
            const agencyCriteria = {
                eligibilityCodes: ['11'],
                keywords: ['Covid'],
            };
            const result = await db.getTotalGrants({ agencyCriteria });
            expect(result).to.equal('1');
        });

        it('gets total grant count matching eligibilityCodes only', async () => {
            const agencyCriteria = {
                eligibilityCodes: ['25'],
            };
            const result = await db.getTotalGrants({ agencyCriteria });
            expect(result).to.equal('2');
        });

        it('gets total grant count matching keywords only', async () => {
            const agencyCriteria = {
                keywords: ['earth sciences'],
            };
            const result = await db.getTotalGrants({ agencyCriteria });
            expect(result).to.equal('1');
        });

        it('gets total grant count with created fromTs', async () => {
            const createdTsBounds = { fromTs: new Date(2021, 7, 9) };
            const result = await db.getTotalGrants({ createdTsBounds });
            expect(result).to.equal('1');
        });

        it('gets total grant count with updated fromTs', async () => {
            const updatedTsBounds = { fromTs: new Date(2021, 7, 9) };
            const result = await db.getTotalGrants({ updatedTsBounds });
            expect(result).to.equal('4');
        });

        it('gets total grant count with updated fromTs and matching agency criteria', async () => {
            const updatedTsBounds = { fromTs: new Date(2021, 7, 9) };
            const agencyCriteria = {
                eligibilityCodes: ['25'],
            };

            const result = await db.getTotalGrants({ updatedTsBounds, agencyCriteria });

            expect(result).to.equal('2');
        });
    });

    context('getClosestGrant', () => {
        it('gets closest grants', async () => {
            const searchTimestamp = new Date('2021-11-02');
            const result = await db.getClosestGrants({
                agency: 0,
                perPage: 10,
                currentPage: 1,
                timestampForTest: searchTimestamp,
            });
            expect(result.data.length).to.equal(1);
            expect(result.data[0].grant_id).to.equal('335255');
        });
    });

    context('getAgencyCriteriaForAgency', () => {
        it('gets agency criteria associated with an agency', async () => {
            const staffUserId = await db.knex(TABLES.users).where('email', fixtures.users.staffUser.email);
            const result = await db.getAgencyCriteriaForAgency(staffUserId[0].agency_id);

            expect(result).to.have.property('eligibilityCodes').with.lengthOf(2);
            expect(result.eligibilityCodes[0])
                .to.equal(fixtures.agencyEligibilityCodes.accountancyNative.code);
            expect(result).to.have.property('keywords').with.lengthOf(1);
            expect(result.keywords[0]).to.equal(fixtures.keywords.accountancyCovid.search_term);
        });
    });

    context('getSingleGrantDetails', () => {
        it('gets the desired grant', async () => {
            const grantId = '335255';
            const result = await db.getSingleGrantDetails({ grantId, tenantId: fixtures.users.staffUser.tenant_id });
            expect(result.grant_id).to.equal('335255');
        });
        it('gets the interested agencies', async () => {
            const grantId = '335255';
            const result = await db.getSingleGrantDetails({ grantId, tenantId: fixtures.users.staffUser.tenant_id });
            expect(result.interested_agencies.length).to.equal(1);
        });
        it('returns dates in string format without timezone', async () => {
            const grantId = '335255';
            const result = await db.getSingleGrantDetails({ grantId, tenantId: fixtures.users.staffUser.tenant_id });
            expect(result.open_date).to.equal('2021-08-11');
            expect(result.close_date).to.equal('2021-11-03');
        });
    });

    context('getGrantsAssignedAgency', () => {
        it('gets grants assigned to agency', async () => {
            const result = await db.getGrants({
                tenantId: fixtures.users.staffUser.tenant_id,
                filters: {
                    assignedToAgency: fixtures.users.staffUser.agency_id.toString(),
                },
            });
            expect(result).to.have.property('data').with.lengthOf(1);
            expect(result.data[0].grant_id)
                .to.equal(fixtures.assignedAgencyGrants.earFellowshipAccountAssign.grant_id);
        });
    });

    context('getAgency', () => {
        it('returns undefined if no agency matches argument', async () => {
            const result = await db.getAgency(999);
            expect(result.length).to.equal(0);
        });
        it('returns single agency if valid ID is supplied', async () => {
            const result = await db.getAgency(fixtures.agencies.accountancy.id);
            expect(result[0].name).to.equal('State Board of Accountancy');
        });
    });

    context('getAgenciesByIds', () => {
        it('returns all agencies matching ID list', async () => {
            const result = await db.getAgenciesByIds([
                fixtures.agencies.accountancy.id,
                fixtures.agencies.fleetServices.id,
            ]);
            expect(result[0].name).to.equal('State Board of Accountancy');
            expect(result[1].name).to.equal('Administration: Fleet Services Division');
        });
        it('returns empty list if IDs do not match any agency', async () => {
            const result = await db.getAgenciesByIds([
                999,
                998,
            ]);
            expect(result).to.have.lengthOf(0);
        });
    });

    context('getUsersByAgency', () => {
        it('returns all users part of the agency', async () => {
            const result = await db.getUsersByAgency(fixtures.agencies.accountancy.id);
            expect(result.length).to.equal(2);
        });
        it('returns empty list if no users are part of the agency', async () => {
            const result = await db.getUsersByAgency(fixtures.agencies.fleetServices.id);
            expect(result.length).to.equal(0);
        });
    });

    context('getUsersEmailAndName', () => {
        it('returns email and name from users', async () => {
            const result = await db.getUsersEmailAndName([
                fixtures.users.adminUser.id,
                fixtures.users.staffUser.id,
            ]);
            expect(result[0]).to.deep.equal({ id: 1, name: 'Admin User', email: 'admin.user@test.com' });
            expect(result[1]).to.deep.equal({ id: 2, name: 'Staff User', email: 'staff.user@test.com' });
        });
        it('returns empty array when invalid ID is passed in', async () => {
            const result = await db.getUsersEmailAndName([
                999,
                998,
            ]);
            expect(result).to.have.lengthOf(0);
        });
    });

    context('getAgenciesSubscribedToDigest', () => {
        it('returns agencies with keywords setup', async () => {
            const result = await db.getAgenciesSubscribedToDigest();
            expect(result.length).to.equal(2);
            // Ensures 'State Board of Sub Accountancy' is not part of the list since it does not have keywords.
            expect(result[0].name).to.equal('State Board of Accountancy');
            expect(result[1].name).to.equal('Administration: Fleet Services Division');
        });
    });

    context('getNewGrantsForAgency', () => {
        beforeEach(() => {
            this.clockFn = (date) => sinon.useFakeTimers(new Date(date));
            this.clock = this.clockFn('2022-06-22');
        });
        afterEach(() => {
            this.clock.restore();
        });
        it('returns zero grants if no grants match criteria and opened yesterday', async () => {
            const result = await db.getNewGrantsForAgency(fixtures.agencies.accountancy);
            expect(result.length).to.equal(0);
        });
        it('returns a grant whose modification date is one day ago', async () => {
            const newGrant = fixtures.grants.healthAide;
            newGrant.grant_id = '444816';
            // Note the use of `Date` -- this ensures compatibility with our mocked time
            newGrant.open_date = new Date('2022-06-21');
            await knex(TABLES.grants).insert(Object.values([newGrant]));
            const result = await db.getNewGrantsForAgency(fixtures.agencies.accountancy);
            expect(result.length).to.equal(1);
        });
    });

    context('userEmailSubscriptionPreferences', () => {
        beforeEach(() => {
            this.clockFn = (date) => sinon.useFakeTimers(new Date(date));
            this.clock = this.clockFn('2022-06-22');
        });
        afterEach(() => {
            this.clock.restore();
        });
        it('gets default email subscription preferences if none exist', async () => {
            const result = await db.getUserEmailSubscriptionPreference(fixtures.users.adminUser.id, fixtures.agencies.accountancy.id);
            expect(result).to.have.all.keys(...Object.values(emailConstants.notificationType));
            const resultSet = new Set(Object.values(result));
            expect(resultSet.size).to.equal(1);
            expect(resultSet.has(emailConstants.emailSubscriptionStatus.subscribed)).to.equal(true);
        });
        it('gets user preferences if custom email subscriptions exist', async () => {
            const preferences = [
                {
                    user_id: fixtures.users.adminUser.id,
                    agency_id: fixtures.agencies.accountancy.id,
                    notification_type: emailConstants.notificationType.grantAssignment,
                    status: emailConstants.emailSubscriptionStatus.subscribed,
                },
                {
                    user_id: fixtures.users.adminUser.id,
                    agency_id: fixtures.agencies.accountancy.id,
                    notification_type: emailConstants.notificationType.grantDigest,
                    status: emailConstants.emailSubscriptionStatus.subscribed,
                },
                {
                    user_id: fixtures.users.adminUser.id,
                    agency_id: fixtures.agencies.accountancy.id,
                    notification_type: emailConstants.notificationType.grantInterest,
                    status: emailConstants.emailSubscriptionStatus.subscribed,
                },
            ];
            await knex('email_subscriptions').insert(preferences);
            const result = await db.getUserEmailSubscriptionPreference(fixtures.users.adminUser.id, fixtures.agencies.accountancy.id);
            expect(result).to.have.all.keys(...Object.values(emailConstants.notificationType));
            const resultSet = new Set(Object.values(result));
            expect(resultSet.size).to.equal(1);
            expect(resultSet.has(emailConstants.emailSubscriptionStatus.subscribed)).to.equal(true);
        });
        it('sets default email subscription preferences if none exist', async () => {
            await db.setUserEmailSubscriptionPreference(fixtures.users.adminUser.id, fixtures.agencies.accountancy.id, {});
            const result = await db.getUserEmailSubscriptionPreference(fixtures.users.adminUser.id, fixtures.agencies.accountancy.id);
            expect(result).to.have.all.keys(...Object.values(emailConstants.notificationType));
            const resultSet = new Set(Object.values(result));
            expect(resultSet.size).to.equal(1);
            expect(resultSet.has(emailConstants.emailSubscriptionStatus.subscribed)).to.equal(true);
        });
        it('sets custom email subscription preferences', async () => {
            await db.setUserEmailSubscriptionPreference(
                fixtures.users.adminUser.id,
                fixtures.agencies.accountancy.id,
                {
                    [emailConstants.notificationType.grantAssignment]: emailConstants.emailSubscriptionStatus.unsubscribed,
                },
            );
            const result = await db.getUserEmailSubscriptionPreference(fixtures.users.adminUser.id, fixtures.agencies.accountancy.id);
            expect(result).to.have.all.keys(...Object.values(emailConstants.notificationType));
            expect(result[emailConstants.notificationType.grantAssignment]).to.equal(emailConstants.emailSubscriptionStatus.unsubscribed);
            const resultSet = new Set(Object.values(result));
            expect(resultSet.size).to.equal(2);
            expect(resultSet.has(emailConstants.emailSubscriptionStatus.subscribed)).to.equal(true);
            expect(resultSet.has(emailConstants.emailSubscriptionStatus.unsubscribed)).to.equal(true);
        });
        it('raises error if unknown notification type is supplied', async () => {
            let expectedError = '';

            const test = async () => {
                try {
                    await db.setUserEmailSubscriptionPreference(
                        fixtures.users.adminUser.id,
                        fixtures.agencies.accountancy.id,
                        {
                            UNKNOWN: emailConstants.emailSubscriptionStatus.subscribed,
                        },
                    );
                } catch (e) {
                    if (e instanceof Error) {
                        expectedError = e;
                    }
                }
            };

            await test();

            expect(expectedError instanceof Error).to.equal(true);
        });
        it('raises error if unknown subscription status is supplied', async () => {
            let expectedError = '';

            const test = async () => {
                try {
                    await db.setUserEmailSubscriptionPreference(
                        fixtures.users.adminUser.id,
                        fixtures.agencies.accountancy.id,
                        {
                            [emailConstants.notificationType.grantAssignment]: 'UNKNOWN',
                        },
                    );
                } catch (e) {
                    if (e instanceof Error) {
                        expectedError = e;
                    }
                }
            };

            await test();

            expect(expectedError instanceof Error).to.equal(true);
        });
        it('default subscribes all users to a notification if no rows exist', async () => {
            await knex('email_subscriptions').del();
            const assignmentResult = await db.getSubscribersForNotification(fixtures.agencies.accountancy.id, emailConstants.notificationType.grantAssignment);
            const assignmentSubscribers = assignmentResult.map((r) => r.email);
            const digestResult = await db.getSubscribersForNotification(fixtures.agencies.accountancy.id, emailConstants.notificationType.grantDigest);
            const digestSubscribers = digestResult.map((r) => r.email);
            const interestResult = await db.getSubscribersForNotification(fixtures.agencies.accountancy.id, emailConstants.notificationType.grantInterest);
            const interestSubscribers = interestResult.map((r) => r.email);

            expect(assignmentResult.length).to.equal(2);
            expect(assignmentSubscribers.includes(fixtures.users.staffUser.email)).to.equal(true);
            expect(assignmentSubscribers.includes(fixtures.users.adminUser.email)).to.equal(true);

            expect(digestResult.length).to.equal(2);
            expect(digestSubscribers.includes(fixtures.users.staffUser.email)).to.equal(true);
            expect(digestSubscribers.includes(fixtures.users.adminUser.email)).to.equal(true);

            expect(interestResult.length).to.equal(2);
            expect(interestSubscribers.includes(fixtures.users.staffUser.email)).to.equal(true);
            expect(interestSubscribers.includes(fixtures.users.adminUser.email)).to.equal(true);
        });
        it('gets subscribed users for an agency', async () => {
            await db.setUserEmailSubscriptionPreference(
                fixtures.users.adminUser.id,
                fixtures.agencies.accountancy.id,
                {
                    [emailConstants.notificationType.grantAssignment]: emailConstants.emailSubscriptionStatus.subscribed,
                    [emailConstants.notificationType.grantDigest]: emailConstants.emailSubscriptionStatus.subscribed,
                    [emailConstants.notificationType.grantInterest]: emailConstants.emailSubscriptionStatus.unsubscribed,
                },
            );
            await db.setUserEmailSubscriptionPreference(
                fixtures.users.staffUser.id,
                fixtures.agencies.accountancy.id,
                {
                    [emailConstants.notificationType.grantAssignment]: emailConstants.emailSubscriptionStatus.subscribed,
                    [emailConstants.notificationType.grantDigest]: emailConstants.emailSubscriptionStatus.unsubscribed,
                    [emailConstants.notificationType.grantInterest]: emailConstants.emailSubscriptionStatus.unsubscribed,
                },
            );
            const assignmentResult = await db.getSubscribersForNotification(
                fixtures.agencies.accountancy.id,
                emailConstants.notificationType.grantAssignment,
            );
            const assignmentSubscribers = assignmentResult.map((r) => r.email);
            const digestResult = await db.getSubscribersForNotification(
                fixtures.agencies.accountancy.id,
                emailConstants.notificationType.grantDigest,
            );
            const digestSubscribers = digestResult.map((r) => r.email);
            const interestResult = await db.getSubscribersForNotification(
                fixtures.agencies.accountancy.id,
                emailConstants.notificationType.grantInterest,
            );
            expect(assignmentResult.length).to.equal(2);
            expect(assignmentSubscribers.includes(fixtures.users.staffUser.email)).to.equal(true);
            expect(assignmentSubscribers.includes(fixtures.users.adminUser.email)).to.equal(true);

            expect(digestResult.length).to.equal(1);
            expect(digestSubscribers.includes(fixtures.users.adminUser.email)).to.equal(true);

            expect(interestResult.length).to.equal(0);
        });
    });
});
