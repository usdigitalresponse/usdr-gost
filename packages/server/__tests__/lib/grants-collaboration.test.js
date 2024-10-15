const { expect, use } = require('chai');
const chaiAsPromised = require('chai-as-promised');
const { DateTime } = require('luxon');
const knex = require('../../src/db/connection');
const fixtures = require('../db/seeds/fixtures');
const { seed } = require('../db/seeds/fixtures');
const { saveNoteRevision, getOrganizationNotesForGrant, getOrganizationNotesForGrantByUser } = require('../../src/lib/grantsCollaboration/notes');
const {
    followGrant, unfollowGrant, getFollowerForGrant, getFollowersForGrant,
} = require('../../src/lib/grantsCollaboration/followers');
const {
    getGrantActivityByUserId, getGrantActivityEmailRecipients,
} = require('../../src/lib/grantsCollaboration/grantActivity');
const emailConstants = require('../../src/lib/email/constants');

use(chaiAsPromised);

afterEach(async () => {
    await seed(knex);
});

describe('Grants Collaboration', () => {
    context('saveNoteRevision', () => {
        it('creates new note', async () => {
            const result = await saveNoteRevision(knex, fixtures.grants.earFellowship.grant_id, fixtures.roles.adminRole.id, 'This is a test revision');
            expect(result.id).to.be.ok;
        });
        it('creates new note revision', async () => {
            const result1 = await saveNoteRevision(knex, fixtures.grants.earFellowship.grant_id, fixtures.roles.adminRole.id, 'This is a test revision');
            const result2 = await saveNoteRevision(knex, fixtures.grants.earFellowship.grant_id, fixtures.roles.adminRole.id, 'This is a test revision #2');

            expect(result2.id).not.to.equal(result1.id);
        });
    });

    context('getOrganizationNotesByUser', () => {
        const { adminUser, staffUser, usdrUser } = fixtures.users;
        const grant = fixtures.grants.earFellowship;
        const tenant = fixtures.tenants.SBA;

        let staffRevision;

        beforeEach(async () => {
            const [staffGrantNote] = await knex('grant_notes')
                .insert({ grant_id: grant.grant_id, user_id: staffUser.id }, 'id');

            [staffRevision] = await knex('grant_notes_revisions')
                .insert({ grant_note_id: staffGrantNote.id, text: 'This is a staff note' }, 'id');

            const [adminGrantNote] = await knex('grant_notes')
                .insert({ grant_id: grant.grant_id, user_id: adminUser.id }, 'id');

            await knex('grant_notes_revisions')
                .insert({ grant_note_id: adminGrantNote.id, text: 'This is a admin note' }, 'id');
        });

        it('gets correct note for user', async () => {
            const results = await getOrganizationNotesForGrantByUser(
                knex,
                tenant.id, // organization ID
                staffUser.id, // user ID
                grant.grant_id, // grant ID
            );

            expect(results.notes).to.have.lengthOf(1);

            expect(results.notes[0].id).equal(staffRevision.id);
            expect(results.notes[0].user.id).equal(staffUser.id);
        });
        it('returns empty results if user has no notes', async () => {
            const results = await getOrganizationNotesForGrantByUser(
                knex,
                tenant.id, // organization ID
                usdrUser.id, // user ID
                grant.grant_id, // grant ID
            );

            expect(results.notes).to.have.lengthOf(0);
        });
    });

    context('getOrganizationNotesForGrant', () => {
        const { adminUser, staffUser } = fixtures.users;
        const agency = fixtures.agencies.accountancy;
        const grant = fixtures.grants.earFellowship;
        const tenant = fixtures.tenants.SBA;

        let staffLastRevision;
        let adminLastRevision;

        beforeEach(async () => {
            const [staffGrantNote] = await knex('grant_notes')
                .insert({ grant_id: grant.grant_id, user_id: staffUser.id }, 'id');

            [staffLastRevision] = await knex('grant_notes_revisions')
                .insert({ grant_note_id: staffGrantNote.id, text: 'This is a staff note' }, 'id');

            const [adminGrantNote] = await knex('grant_notes')
                .insert({ grant_id: grant.grant_id, user_id: adminUser.id }, 'id');

            await knex('grant_notes_revisions')
                .insert({ grant_note_id: adminGrantNote.id, text: 'This is a test revision' }, 'id');

            [adminLastRevision] = await knex('grant_notes_revisions')
                .insert({ grant_note_id: adminGrantNote.id, text: 'This is a test revision #2' }, 'id');
        });

        it('gets correct note/revision structure for grant', async () => {
            const results = await getOrganizationNotesForGrant(knex, grant.grant_id, tenant.id);

            expect(results.notes).to.have.lengthOf(2);

            const expectedRevisedNoteStructure = {
                ...results.notes[0],
                id: adminLastRevision.id,
                isRevised: true,
                text: 'This is a test revision #2',
                grant: { id: grant.grant_id },
                user: {
                    ...results.notes[0].user,
                    id: adminUser.id,
                    name: adminUser.name,
                    email: adminUser.email,
                    team: {
                        id: agency.id,
                        name: agency.name,
                    },
                    organization: {
                        id: tenant.id,
                        name: tenant.display_name,
                    },
                },
            };

            expect(DateTime.fromJSDate(results.notes[0].createdAt).isValid).to.be.true;
            expect(results.notes[0]).to.deep.equal(expectedRevisedNoteStructure);

            expect(results.notes[1].isRevised).to.be.false;
        });

        it('get NO organization notes for unrelated tenant', async () => {
            const result = await getOrganizationNotesForGrant(knex, grant.grant_id, fixtures.agencies.usdr.tenant_id);

            expect(result.notes).to.have.length(0);
            expect(result.pagination.next).to.be.null;
        });

        it('gets filtered notes for grant using cursor (pagination)', async () => {
            const results = await getOrganizationNotesForGrant(
                knex,
                grant.grant_id,
                tenant.id,
                { cursor: adminLastRevision.id },
            );

            expect(results.notes).to.have.length(1);

            expect(results.notes[0]).to.deep.include({
                id: staffLastRevision.id,
                text: 'This is a staff note',
            });

            expect(results.pagination.next).to.be.null;
        });
        it('correctly indicates remaining result sets (pagination)', async () => {
            const results = await getOrganizationNotesForGrant(
                knex,
                grant.grant_id,
                agency.tenant_id,
                { limit: 1 },
            );

            expect(results.notes).to.have.length(1);
            expect(results.pagination.next).equal(adminLastRevision.id);
        });
    });
    context('followGrant', () => {
        it('follows a grant', async () => {
            await followGrant(knex, fixtures.grants.earFellowship.grant_id, fixtures.users.adminUser.id);
        });
        it('suppresses unique constraint violations when trying to follow a grant twice', async () => {
            await expect(followGrant(knex, fixtures.grants.earFellowship.grant_id, fixtures.users.adminUser.id)).to.not.be.rejected;
        });
        it('does not suppress non-unique constraint violation errors', async () => {
            // First ensure the test user id is invalid
            await expect(knex('users').where({ id: 999999999 })).to.eventually.be.an('array').that.is.empty;
            await expect(followGrant(knex, fixtures.grants.earFellowship.grant_id, 999999999)).to.be.rejected;
        });
    });
    context('unfollowGrant', () => {
        it('unfollows a grant', async () => {
            await unfollowGrant(knex, fixtures.grants.earFellowship.grant_id, fixtures.users.adminUser.id);
        });
    });
    context('getFollowerForGrant', () => {
        let follower;
        beforeEach(async () => {
            [follower] = await knex('grant_followers')
                .insert({
                    grant_id: fixtures.grants.earFellowship.grant_id,
                    user_id: fixtures.users.adminUser.id,
                }, 'id');
        });

        it('retrieves follower for a grant', async () => {
            const result = await getFollowerForGrant(knex, fixtures.grants.earFellowship.grant_id, fixtures.users.adminUser.id);

            expect(result.id).to.equal(follower.id);
        });
        it('returns null for not found', async () => {
            const result = await getFollowerForGrant(knex, 'grant_id', fixtures.users.adminUser.id);

            expect(result).to.equal(null);
        });
    });
    context('getFollowersForGrant', () => {
        let follower1;
        let follower2;
        beforeEach(async () => {
            [follower1] = await knex('grant_followers')
                .insert({ grant_id: fixtures.grants.earFellowship.grant_id, user_id: fixtures.users.adminUser.id }, 'id');

            [follower2] = await knex('grant_followers')
                .insert({ grant_id: fixtures.grants.earFellowship.grant_id, user_id: fixtures.users.staffUser.id }, 'id');
        });

        it('retrieves ALL followers for a grant', async () => {
            const result = await getFollowersForGrant(knex, fixtures.grants.earFellowship.grant_id, fixtures.agencies.accountancy.tenant_id, {
                cursor: null,
            });

            expect(result.followers).to.have.lengthOf(2);
            expect(result.followers[0].id).to.equal(follower2.id);
        });

        it('retrieves followers for a grant with PAGINATION', async () => {
            const result = await getFollowersForGrant(knex, fixtures.grants.earFellowship.grant_id, fixtures.agencies.accountancy.tenant_id, {
                cursor: follower2.id,
            });

            expect(result.followers).to.have.lengthOf(1);
            expect(result.followers[0].id).to.equal(follower1.id);
            expect(result.pagination.next).to.equal(null);
        });

        it('retrieves followers for a grant with LIMIT', async () => {
            const result = await getFollowersForGrant(knex, fixtures.grants.earFellowship.grant_id, fixtures.agencies.accountancy.tenant_id, {
                limit: 1,
            });

            expect(result.followers).to.have.lengthOf(1);
            expect(result.pagination.next).to.equal(follower2.id);
        });
    });

    context('Grant Activity', () => {
        // Helper functions
        const getUserIdsForActivities = (grants) => {
            const ids = grants.reduce((userIds, grant) => {
                grant.notes.forEach((act) => userIds.add(act.userId));
                grant.follows.forEach((act) => userIds.add(act.userId));
                return userIds;
            }, new Set());

            return Array.from(ids);
        };

        const subscribeUser = async (user) => {
            await knex('email_subscriptions').insert({
                user_id: user.id,
                agency_id: user.agency_id,
                notification_type: emailConstants.notificationType.grantActivity,
                status: emailConstants.emailSubscriptionStatus.subscribed,
            });
        };

        const { adminUser, staffUser } = fixtures.users;
        const grant1 = fixtures.grants.earFellowship;
        const grant2 = fixtures.grants.healthAide;

        let periodStart;
        let periodEnd;

        let grant1NoteAdmin;
        let grant1NoteStaff;

        beforeEach(async () => {
            subscribeUser(adminUser);
            subscribeUser(staffUser);

            periodStart = DateTime.now().minus({ days: 1 }).toJSDate();

            // Grant 1 Follows
            await knex('grant_followers')
                .insert({ grant_id: grant1.grant_id, user_id: adminUser.id }, 'id');

            await knex('grant_followers')
                .insert({ grant_id: grant1.grant_id, user_id: staffUser.id }, 'id');

            // Grant 1 Notes
            [grant1NoteAdmin] = await knex('grant_notes')
                .insert({ grant_id: grant1.grant_id, user_id: adminUser.id }, 'id');

            await knex('grant_notes_revisions')
                .insert({ grant_note_id: grant1NoteAdmin.id, text: 'Admin note' }, 'id');

            [grant1NoteStaff] = await knex('grant_notes')
                .insert({ grant_id: grant1.grant_id, user_id: staffUser.id }, 'id');

            await knex('grant_notes_revisions')
                .insert({ grant_note_id: grant1NoteStaff.id, text: 'Staff note' }, 'id');

            // Grant 2 Follows
            await knex('grant_followers')
                .insert({ grant_id: grant2.grant_id, user_id: staffUser.id }, 'id');

            await knex('grant_followers')
                .insert({ grant_id: grant2.grant_id, user_id: adminUser.id }, 'id');

            // Grant 2 Notes
            const [grant2NoteStaff] = await knex('grant_notes')
                .insert({ grant_id: grant2.grant_id, user_id: staffUser.id }, 'id');

            await knex('grant_notes_revisions')
                .insert({ grant_note_id: grant2NoteStaff.id, text: 'Staff note' }, 'id');

            periodEnd = new Date();
        });

        it('retrieves all email recipients for note/follow activity by period', async () => {
            const recipients = await getGrantActivityEmailRecipients(knex, periodStart, periodEnd);

            expect(recipients).to.have.length(2);

            expect(recipients).to.have.members([
                adminUser.id,
                staffUser.id,
            ]);
        });

        it('does not return recipients if users are unsubscribed', async () => {
            // Unsubscribe all users
            await knex('email_subscriptions').update({ status: emailConstants.emailSubscriptionStatus.unsubscribed });

            const recipients = await getGrantActivityEmailRecipients(knex, periodStart, periodEnd);

            expect(recipients).to.have.length(0);
        });

        it('retrieves all note/follow activity by period', async () => {
            const grantActivity = await getGrantActivityByUserId(knex, adminUser.id, periodStart, periodEnd);

            expect(grantActivity.grants).to.have.lengthOf(2);
            expect(grantActivity.userEmail).to.equal(adminUser.email);
            expect(grantActivity.userName).to.equal(adminUser.name);
            expect(grantActivity.grants[0].grantId).to.equal(grant1.grant_id);
            expect(grantActivity.grants[0].notes).to.have.lengthOf(1);
            expect(grantActivity.grants[0].follows).to.have.lengthOf(1);
            expect(grantActivity.grants[0].notes[0].noteText).to.equal('Staff note');
            expect(grantActivity.grants[0].follows[0].userId).to.equal(staffUser.id);
        });

        it('retrieves email recipients only if OTHER users took action', async () => {
            periodStart = new Date();

            // Admin edits note
            await knex('grant_notes_revisions')
                .insert({ grant_note_id: grant1NoteAdmin.id, text: 'Edit for Admin note' }, 'id');

            const recipients1 = await getGrantActivityEmailRecipients(knex, periodStart, new Date());
            expect(recipients1).to.have.members([staffUser.id]);

            // Staff edits note
            await knex('grant_notes_revisions')
                .insert({ grant_note_id: grant1NoteStaff.id, text: 'Edit for Staff note' }, 'id');

            const recipients2 = await getGrantActivityEmailRecipients(knex, periodStart, new Date());
            expect(recipients2).to.have.members([staffUser.id, adminUser.id]);
        });

        it('retrieves activity only for OTHER users action', async () => {
            const adminGrantActivity = await getGrantActivityByUserId(knex, adminUser.id, periodStart, periodEnd);
            const adminActivityIds = getUserIdsForActivities(adminGrantActivity.grants);
            expect(adminActivityIds).not.to.include(adminUser.id);

            const staffGrantActivity = await getGrantActivityByUserId(knex, staffUser.id, periodStart, periodEnd);
            const staffActivityIds = getUserIdsForActivities(staffGrantActivity.grants);
            expect(staffActivityIds).not.to.include(staffUser.id);
        });

        it('retrieves no note/follow activity when window is outside time period of activity', async () => {
            periodStart = DateTime.fromJSDate(periodStart).minus({ days: 1 }).toJSDate();
            periodEnd = DateTime.fromJSDate(periodEnd).minus({ days: 1 }).toJSDate();

            const recipients = await getGrantActivityEmailRecipients(knex, periodStart, periodEnd);
            expect(recipients).to.have.lengthOf(0);

            await Promise.all(
                [adminUser.id, staffUser.id].map(async (userId) => {
                    const grantActivity = await getGrantActivityByUserId(knex, userId, periodStart, periodEnd);
                    expect(grantActivity.grants).to.have.lengthOf(0);
                }),
            );
        });

        context('Grant activity by other org/tenants', async () => {
            const { usdrUser: otherUser1, usdrAdmin: otherUser2 } = fixtures.users;

            beforeEach(async () => {
                await subscribeUser(otherUser1);
                await subscribeUser(otherUser2);

                await knex('grant_followers')
                    .insert([
                        { grant_id: grant1.grant_id, user_id: otherUser1.id },
                        { grant_id: grant1.grant_id, user_id: otherUser2.id },
                    ], 'id');

                const [otherUser1Note, otherUser2Note] = await knex('grant_notes')
                    .insert([
                        { grant_id: grant1.grant_id, user_id: otherUser1.id },
                        { grant_id: grant1.grant_id, user_id: otherUser2.id },
                    ], 'id');

                await knex('grant_notes_revisions')
                    .insert([
                        { grant_note_id: otherUser1Note.id, text: 'Other tenant note1' },
                        { grant_note_id: otherUser2Note.id, text: 'Other tenant note2' },
                    ], 'id');
                periodEnd = new Date();
            });

            it('Includes recipients from multiple tenants', async () => {
                // Email recipients INCLUDES multiple tenants
                expect(await getGrantActivityEmailRecipients(knex, periodStart, periodEnd)).to.have.members([
                    adminUser.id,
                    staffUser.id,
                    otherUser1.id,
                    otherUser2.id,
                ]);
            });

            it('Does NOT include cross-over activity events from multiple tenants', async () => {
                const getGrantActivity = async (userId) => {
                    const grantActivity = await getGrantActivityByUserId(knex, userId, periodStart, periodEnd);
                    return grantActivity.grants;
                };

                const tenantOneUsers = [adminUser.id, staffUser.id];
                const tenantTwoUsers = [otherUser1.id, otherUser2.id];

                const tenantOneGrants = await Promise.all(
                    tenantOneUsers.map((userId) => getGrantActivity(userId)),
                );
                const tenantOneUserIds = getUserIdsForActivities(tenantOneGrants.flat());
                expect(tenantOneUserIds).not.to.include.members(tenantTwoUsers);

                const tenantTwoGrants = await Promise.all(
                    tenantTwoUsers.map((userId) => getGrantActivity(userId)),
                );
                const tenantTwoUserIds = getUserIdsForActivities(tenantTwoGrants.flat());
                expect(tenantTwoUserIds).not.to.include.members(tenantOneUsers);
            });
        });
    });
});
