exports.up = function (knex) {
    return knex.schema
        .createTable('grants_interested', (table) => {
            table.integer('agency_id').unsigned().notNullable();
            table.string('grant_id').notNullable();
            table.integer('user_id').unsigned();
            table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
            table.timestamp('updated_at');
            table.foreign('agency_id').references('agencies.id').onDelete('CASCADE');
            table.foreign('grant_id').references('grants.grant_id').onDelete('CASCADE');
            table.foreign('user_id').references('users.id').onDelete('CASCADE');
            table.primary(['agency_id', 'grant_id']);
        })
        .table('grants_viewed', (table) => {
            table.integer('user_id').unsigned();
            table.foreign('user_id').references('users.id').onDelete('CASCADE');
        });
};

exports.down = function (knex) {
    return knex.schema
        .dropTable('grants_interested')
        .table('grants_viewed', (table) => {
            table.dropColumn('user_id');
        });
};
