const db = require('../../src/db');
const fixtures = require('../db/seeds/fixtures');

beforeEach(async function () {
    this.timeout(5000);
    await fixtures.seed(db.knex);
});

after(async () => {
    await db.knex.destroy();
});
