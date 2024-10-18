const { expect, use } = require('chai');
const chaiAsPromised = require('chai-as-promised');
const { DateTime } = require('luxon');
const knex = require('../../src/db/connection');
const fixtures = require('../db/seeds/fixtures');
const {
    saveNoteRevision, getOrganizationNotesForGrant, getOrganizationNotesForGrantByUser, deleteGrantNotesByUser,
} = require('../../src/lib/grantsCollaboration/notes');
const {
    followGrant, unfollowGrant, getFollowerForGrant, getFollowersForGrant,
} = require('../../src/lib/grantsCollaboration/followers');

use(chaiAsPromised);

describe('Grants Collaboration', () => {
    context('saveNoteRevision', () => {
        const { adminUser } = fixtures.users;
        const grant = fixtures.grants.earFellowship;

        it('creates new note', async () => {
            const result = await saveNoteRevision(knex, grant.grant_id, adminUser.id, 'This is a test revision');
            expect(result.id).to.be.ok;

            const [grantNote] = await knex('grant_notes').where({
                grant_id: grant.grant_id,
                user_id: adminUser.id,
            }).returning(['is_published']);

            console.log(grantNote);
            expect(grantNote.is_published).to.equal(true);
        });
        it('creates new note revision', async () => {
            const result1 = await saveNoteRevision(knex, grant.grant_id, adminUser.id, 'This is a test revision');
            const result2 = await saveNoteRevision(knex, grant.grant_id, adminUser.id, 'This is a test revision #2');

            expect(result2.id).not.to.equal(result1.id);
        });
        it('Re-publishes old notes upon new revision', async () => {
            const expectedNote = {
                grant_id: grant.grant_id,
                user_id: adminUser.id,
            };

            await saveNoteRevision(knex, grant.grant_id, adminUser.id, 'This is a test revision');

            await knex('grant_notes').where(expectedNote).update({ is_published: false });

            await saveNoteRevision(knex, grant.grant_id, adminUser.id, 'This is a test revision #2');

            const [note] = await knex('grant_notes').select('is_published').where(expectedNote);
            expect(note.is_published).to.equal(true);
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
        it('ignores unpublished notes', async () => {
            await knex('grant_notes').where({ grant_id: grant.grant_id }).update({ is_published: false });

            const results = await getOrganizationNotesForGrantByUser(
                knex,
                tenant.id, // organization ID
                staffUser.id, // user ID
                grant.grant_id, // grant ID
            );

            expect(results.notes).to.have.length(0);
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
            await knex.transaction(async (trx) => {
                const [staffGrantNote] = await trx('grant_notes')
                    .insert({ grant_id: grant.grant_id, user_id: staffUser.id }, 'id');

                [staffLastRevision] = await trx('grant_notes_revisions')
                    .insert({ grant_note_id: staffGrantNote.id, text: 'This is a staff note' }, 'id');
            });

            let adminGrantNote;

            await knex.transaction(async (trx) => {
                [adminGrantNote] = await trx('grant_notes')
                    .insert({ grant_id: grant.grant_id, user_id: adminUser.id }, 'id');

                await trx('grant_notes_revisions')
                    .insert({ grant_note_id: adminGrantNote.id, text: 'This is a test revision' }, 'id');
            });

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

        it('ignores unpublished notes', async () => {
            await knex('grant_notes').where({ grant_id: grant.grant_id }).update({ is_published: false });

            const result = await getOrganizationNotesForGrant(knex, grant.grant_id, tenant.id);

            expect(result.notes).to.have.length(0);
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
    context('deleteGrantNotesByUser', () => {
        const { staffUser } = fixtures.users;
        const grant = fixtures.grants.earFellowship;

        let staffGrantNote;

        beforeEach(async () => {
            [staffGrantNote] = await knex('grant_notes')
                .insert({ grant_id: grant.grant_id, user_id: staffUser.id }, 'id');

            await knex('grant_notes_revisions')
                .insert({ grant_note_id: staffGrantNote.id, text: 'This is a staff note' });

            await knex('grant_notes_revisions')
                .insert({ grant_note_id: staffGrantNote.id, text: 'This is a staff note revision' });
        });

        it('Deletes (marks unpublished) all notes for user', async () => {
            const revisions = await knex('grant_notes_revisions').where('grant_note_id', staffGrantNote.id);
            expect(revisions).to.have.length(2);

            await deleteGrantNotesByUser(knex, grant.grant_id, staffUser.id);

            const notesAfter = await knex('grant_notes')
                .where('id', staffGrantNote.id)
                .andWhere('is_published', true);
            expect(notesAfter).to.have.length(0);
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
});
