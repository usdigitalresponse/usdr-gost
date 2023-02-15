/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
    await knex('interested_codes').where({ name: 'Applied' }).update({ name: 'Pending' });
    await knex('interested_codes').where({ name: 'Awarded' }).update({ name: 'Award' });
    await knex('interested_codes').where({ name: 'Rejected' }).update({ name: 'Non-award' });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
    await knex('interested_codes').where({ name: 'Pending' }).update({ name: 'Applied' });
    await knex('interested_codes').where({ name: 'Award' }).update({ name: 'Awarded' });
    await knex('interested_codes').where({ name: 'Non-award' }).update({ name: 'Rejected' });
};
