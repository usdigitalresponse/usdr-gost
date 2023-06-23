const db = require('../../src/db');
const fixtures = require('./seeds/fixtures');

before(() => {
    fixtures.seed(db.knex);
});

after(() => {
    console.log('DESTROYING>.............');
    db.knex.destroy();
});
