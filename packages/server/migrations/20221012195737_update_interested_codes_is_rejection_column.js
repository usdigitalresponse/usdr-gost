/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
    // Create a new column as grant statuses are no longer binary and a boolean will no longer be sufficient
    await knex.schema.table('interested_codes', (table) => { table.string('status_code'); });

    // Copying existing is_rejection column values over to the new column
    await knex('interested_codes').where({ is_rejection: false }).update({ status_code: 'Interested' });
    await knex('interested_codes').where({ is_rejection: true }).update({ status_code: 'Rejected' });
    await knex('interested_codes').insert([
        {
            name: 'Applied',
            status_code: 'Result',
        },
        {
            name: 'Awarded',
            status_code: 'Result',
        },
        {
            name: 'Rejected',
            status_code: 'Result',
        },
    ]);

    await knex.schema.table('interested_codes', (table) => { table.dropColumn('is_rejection'); });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
    await knex.schema.table('interested_codes', (table) => { table.boolean('is_rejection'); });

    await knex('interested_codes').where({ status_code: 'Interested' }).update({ is_rejection: false });
    await knex('interested_codes').where({ status_code: 'Rejected' }).update({ is_rejection: true });
    await knex('interested_codes').whereIn('name', ['Applied', 'Awarded', 'Rejected']).del();

    await knex.schema.table('interested_codes', (table) => { table.dropColumn('status_code'); });
};
