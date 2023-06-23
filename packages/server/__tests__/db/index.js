const saved_search = require('./suites/saved_search.test');
const db = require('./suites/db.test');

describe('Subject', function () {
    describe('first suite', saved_search.bind(this));
    describe('second suite', db.bind(this));
});
