exports.up = function (knex) {
    return knex.schema.alterTable('keywords', (table) => {
        table.dropForeign('agency_id');
        table
            .foreign('agency_id')
            .references('agencies.id')
            .onDelete('CASCADE')
            .onUpdate('CASCADE');
    });
};

exports.down = function (knex) {
    return knex.schema.alterTable('keywords', (table) => {
        table.dropForeign('agency_id');
        table
            .foreign('agency_id')
            .references('agencies.id')
            .onDelete('NO ACTION')
            .onUpdate('NO ACTION');
    });
};
