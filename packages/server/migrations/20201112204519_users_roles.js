/* eslint-disable func-names */

exports.up = function (knex) {
    return knex.schema
        .createTable('roles', (table) => {
            table.increments('id').primary();
            table.string('name').notNullable().unique();
            table.json('rules').notNullable();
            table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
        })
        .createTable('users', (table) => {
            table.increments('id').primary();
            table.string('email').notNullable().unique();
            table.string('name');
            table.integer('role_id').unsigned();
            table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
            table.json('tags');

            table.foreign('role_id').references('roles.id').onDelete('SET NULL');
        })
        .createTable('access_tokens', (table) => {
            table.increments('id').primary();
            table.integer('user_id').unsigned();
            table.string('passcode', 200).notNullable().unique();
            table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
            table.timestamp('expires').notNullable();
            table.boolean('used').notNullable();

            table.foreign('user_id').references('users.id');
        });
};

exports.down = function (knex) {
    return knex.schema
        .dropTable('access_tokens')
        .dropTable('users')
        .dropTable('roles');
};
