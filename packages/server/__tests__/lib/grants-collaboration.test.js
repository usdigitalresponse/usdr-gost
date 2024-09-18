const { expect, use } = require('chai');
const chaiAsPromised = require('chai-as-promised');
const knex = require('../../src/db/connection');
const fixtures = require('../db/seeds/fixtures');
const { saveNoteRevision, getOrganizationNotesForGrant } = require('../../src/lib/grantsCollaboration/notes');
const {
    followGrant, unfollowGrant, getFollowerForGrant, getFollowersForGrant,
} = require('../../src/lib/grantsCollaboration/followers');

use(chaiAsPromised);

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
    context('getOrganizationNotesForGrant', () => {
        let revision1;
        let revision2;
        beforeEach(async () => {
            const [grantNote] = await knex('grant_notes')
                .insert({ grant_id: fixtures.grants.earFellowship.grant_id, user_id: fixtures.roles.adminRole.id }, 'id');

            [revision1] = await knex('grant_notes_revisions')
                .insert({ grant_note_id: grantNote.id, text: 'This is a test revision' }, 'id');

            [revision2] = await knex('grant_notes_revisions')
                .insert({ grant_note_id: grantNote.id, text: 'This is a test revision #2' }, 'id');
        });

        it('get existing organization notes for grant', async () => {
            const result = await getOrganizationNotesForGrant(knex, fixtures.grants.earFellowship.grant_id, fixtures.agencies.accountancy.tenant_id);
            const expectedNoteStructure = {
                notes: [{
                    id: revision2.id,
                    createdAt: result.notes[0].createdAt, // store to pass structure check
                    text: 'This is a test revision #2',
                    grant: { id: fixtures.grants.earFellowship.grant_id },
                    user: {
                        id: fixtures.roles.adminRole.id,
                        name: fixtures.users.adminUser.name,
                        team: {
                            id: fixtures.agencies.accountancy.id,
                            name: fixtures.agencies.accountancy.name,
                        },
                        organization: {
                            id: fixtures.tenants.SBA.id,
                            name: fixtures.tenants.SBA.display_name,
                        },
                    },
                }],
                pagination: {
                    from: revision2.id,
                },
            };

            // validate createdAt is valid time
            expect(result.notes[0].createdAt).to.satisfy((date) => {
                const timestamp = new Date(date).getTime();
                return !Number.isNaN(timestamp);
            });

            // remove createdAt to validate the rest of the structure
            delete expectedNoteStructure.notes[0].createdAt;
            delete result.notes[0].createdAt;

            expect(result).to.deep.equal(expectedNoteStructure);
        });
        it('get existing organization notes for grant after a revision', async () => {
            const result = await getOrganizationNotesForGrant(
                knex,
                fixtures.grants.earFellowship.grant_id,
                fixtures.agencies.accountancy.tenant_id,
                { afterRevision: revision1.id },
            );
            const expectedNoteStructure = {
                notes: [{
                    id: revision2.id,
                    createdAt: result.notes[0].createdAt, // store to pass structure check
                    text: 'This is a test revision #2',
                    grant: { id: fixtures.grants.earFellowship.grant_id },
                    user: {
                        id: fixtures.roles.adminRole.id,
                        name: fixtures.users.adminUser.name,
                        team: {
                            id: fixtures.agencies.accountancy.id,
                            name: fixtures.agencies.accountancy.name,
                        },
                        organization: {
                            id: fixtures.tenants.SBA.id,
                            name: fixtures.tenants.SBA.display_name,
                        },
                    },
                }],
                pagination: {
                    from: revision2.id,
                },
            };
            // validate createdAt is valid time
            expect(result.notes[0].createdAt).to.satisfy((date) => {
                const timestamp = new Date(date).getTime();
                return !Number.isNaN(timestamp);
            });

            // remove createdAt to validate the rest of the structure
            delete expectedNoteStructure.notes[0].createdAt;
            delete result.notes[0].createdAt;

            expect(result).to.deep.equal(expectedNoteStructure);
        });
        it('get no organization notes for grant after a revision', async () => {
            const result = await getOrganizationNotesForGrant(
                knex,
                fixtures.grants.earFellowship.grant_id,
                fixtures.agencies.accountancy.tenant_id,
                { afterRevision: revision2.id },
            );
            const expectedNoteStructure = {
                notes: [],
                pagination: {
                    from: revision2.id,
                },
            };

            expect(result).to.deep.equal(expectedNoteStructure);
        });
        it('get no organization notes for grant', async () => {
            const result = await getOrganizationNotesForGrant(knex, fixtures.grants.earFellowship.grant_id, fixtures.agencies.usdr.tenant_id);
            const expectedNoteStructure = {
                notes: [],
                pagination: {
                    from: undefined,
                },
            };

            expect(result).to.deep.equal(expectedNoteStructure);
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
                beforeFollow: null,
            });

            expect(result.followers).to.have.lengthOf(2);
            expect(result.followers[0].id).to.equal(follower2.id);
        });

        it('retrieves followers for a grant with PAGINATION', async () => {
            const result = await getFollowersForGrant(knex, fixtures.grants.earFellowship.grant_id, fixtures.agencies.accountancy.tenant_id, {
                beforeFollow: follower2.id,
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
});
