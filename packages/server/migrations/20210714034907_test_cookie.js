/* eslint-disable func-names */
exports.up = function (knex) {
    return knex.schema
        .createTable('test_cookie', (table) => {
            table.string('key');
            table.string('cookie');

            table.primary(['key']);
        });
};

exports.down = function (knex) {
    return knex.schema
        .dropTable('test_cookie');
};
