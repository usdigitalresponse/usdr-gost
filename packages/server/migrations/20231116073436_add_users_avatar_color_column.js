/**
 * Adds avatar_color column which is randomly assigned a hex color
 * via the default function (reference: https://dbfiddle.uk/Jz_ouKhI)
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema.alterTable('users', (table) => {
        table.string('avatar_color', 7).defaultTo(knex.raw(`(array[
            '#44337A',
            '#086F83',
            '#234E52',
            '#702459',
            '#602314',
            '#BA8C03',
            '#6610F2', 
            '#0DCAF0',
            '#198754',
            '#D63384',
            '#FD7E14',
            '#FFC107',
            '#B794F4',
            '#76E4F7',
            '#20C997',
            '#F687B3',
            '#F4B46D',
            '#FCD663'
        ])[floor(random() * 18 + 1)::int];`)).notNullable();
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema.alterTable('users', (table) => {
        table.dropColumn('avatar_color');
    });
};
