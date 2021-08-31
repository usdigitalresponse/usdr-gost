exports.up = function (knex) {
    return knex.schema
        .dropTable('assigned_grants_user');
};

exports.down = function () {
    return Promise.resolve();
};
