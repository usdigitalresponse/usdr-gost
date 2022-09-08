exports.up = function (knex) {
    return knex.schema
        .dropTable('assigned_grants_user');
};

exports.down = function (knex) {
    return knex.schema
        .createTable('assigned_grants_user', (table) => {
            table.integer('user_id').unsigned();
            table.foreign('user_id').references('users.id').onDelete('CASCADE');
            table.string('grant_id');
            table.foreign('grant_id').references('grants.grant_id').onDelete('CASCADE');
            table.integer('assigned_by').unsigned();
            table.foreign('assigned_by').references('users.id').onDelete('CASCADE');
            table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
            table.timestamp('updated_at');

            table.primary(['user_id', 'grant_id']);
        });
};
