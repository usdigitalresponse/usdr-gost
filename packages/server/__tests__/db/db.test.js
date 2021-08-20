const { expect } = require('chai');
const db = require('../../src/db');
const knex = require('../../src/db/connection');
const { TABLES } = require('../../src/db/constants');
const fixtures = require('./seeds/fixtures');

after(() => {
    knex.destroy();
})

describe('db', () => {
    context('getTotalGrants', () => {
        it('gets total grant count with no parameters', async () => {
            const result = await db.getTotalGrants();
            expect(result).to.equal('3');
        });

        it('gets total grant count matching agency criteria', async () => {
            const agencyCriteria = {
                eligibilityCodes: ['11'],
                keywords: ['Covid'],
            }
            const result = await db.getTotalGrants({ agencyCriteria });

            expect(result).to.equal('1');
        });

        it('gets total grant count matching eligibilityCodes only', async () => {
            const agencyCriteria = {
                eligibilityCodes: ['25'],
            }
            const result = await db.getTotalGrants({ agencyCriteria });

            expect(result).to.equal('2');
        });

        it('gets total grant count matching keywords only', async () => {
            const agencyCriteria = {
                keywords: ['earth sciences'],
            }
            const result = await db.getTotalGrants({ agencyCriteria });

            expect(result).to.equal('1');
        });
    });

    context('getAgencyCriteriaForUserId', () => {
        it('gets agency criteria associated with a userId', async () => {
            const staffUserId = await knex(TABLES.users).select('id').where('email', fixtures.users.staffUser.email);

            const result = await db.getAgencyCriteriaForUserId(staffUserId[0].id);

            expect(result).to.have.property('eligibilityCodes').with.lengthOf(1);
            expect(result.eligibilityCodes[0]).to.equal(fixtures.agencyEligibilityCodes.accountancyNative.code);
            expect(result).to.have.property('keywords').with.lengthOf(1);
            expect(result.keywords[0]).to.equal(fixtures.keywords.accountancyCovid.search_term)
        });
    })
});