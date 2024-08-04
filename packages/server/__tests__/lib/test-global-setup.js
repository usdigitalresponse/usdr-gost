const db = require('../../src/db');
const fixtures = require('../db/seeds/fixtures');

before(async () => {
    await fixtures.seed(db.knex);
});

after(async () => {
    await db.knex.destroy();
});
