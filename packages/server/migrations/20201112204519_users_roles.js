exports.up = function (knex) {
    return knex.schema
        .createTable('users', (table) => {
            table.increments('id').primary();
            table.text('email').notNullable().unique();
            table.text('name');
            table.text('role').notNullable();
            table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
            table.json('tags');
        })
        .createTable('roles', (table) => {
            table.increments('id').primary();
            table.text('name').notNullable().unique();
            table.json('rules').notNullable();
            table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
        })
        .createTable('access_tokens', (table) => {
            table.increments('id').primary();
            table.integer('user_id').unsigned().notNullable();
            table.string('passcode', 200).notNullable().unique();
            table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
            table.timestamp('expires').notNullable();
            table.boolean('used').notNullable();

            table.foreign('user_id').references('users.id').onDelete('CASCADE');
        });
};

exports.down = function (knex) {
    return knex.schema
        .dropTable('access_tokens')
        .dropTable('roles')
        .dropTable('users');
};
