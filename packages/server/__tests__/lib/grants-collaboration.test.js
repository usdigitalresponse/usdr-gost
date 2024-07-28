const { expect } = require('chai');
const db = require('../../src/db');
const knex = require('../../src/db/connection');
const fixtures = require('../db/seeds/fixtures');
const { saveNoteRevision, getOrganizationNotesForGrant } = require('../../src/lib/grantsCollaboration/notes');

describe('db', () => {
    before(async () => {
        await fixtures.seed(db.knex);
    });

    after(async () => {
        await db.knex.destroy();
    });
    context('saveNoteRevision', () => {
        it('creates new note', async () => {
            const result = await saveNoteRevision(knex, fixtures.grants.earFellowship.grant_id, fixtures.roles.adminRole.id, 'This is a test revision');
            expect(result.id).to.equal(1);
        });
        it('creates new note revision', async () => {
            const result = await saveNoteRevision(knex, fixtures.grants.earFellowship.grant_id, fixtures.roles.adminRole.id, 'This is a test revision #2');
            expect(result.id).to.equal(2);
        });
    });
    context('getOrganizationNotesForGrant', () => {
        it('get existing organization notes for grant', async () => {
            const result = await getOrganizationNotesForGrant(knex, fixtures.grants.earFellowship.grant_id, fixtures.agencies.accountancy.tenant_id);
            const expectedNoteStructure = {
                notes: [{
                    id: 2,
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
                    from: 2,
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
    });
});
