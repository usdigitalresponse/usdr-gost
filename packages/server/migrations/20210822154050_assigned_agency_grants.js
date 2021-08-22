exports.up = function (knex) {
    return knex.schema
        .createTable('assigned_grants_agency', (table) => {
            table.integer('agency_id').unsigned();
            table.foreign('agency_id').references('agencies.id').onDelete('CASCADE');
            table.string('grant_id');
            table.foreign('grant_id').references('grants.grant_id').onDelete('CASCADE');
            table.integer('assigned_by').unsigned();
            table.foreign('assigned_by').references('users.id').onDelete('CASCADE');
            table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
            table.timestamp('updated_at');

            table.primary(['agency_id', 'grant_id']);
        });
};

exports.down = function (knex) {
    return knex.schema
        .dropTable('assigned_grants_agency');
};
