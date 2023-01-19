/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
    await knex.schema.table('keywords', (table) => { table.string('type'); });
    try {
        await knex.transaction(async (trx) => {
            await trx('keywords').update('type', 'include');
        });
    } catch (err) {
        console.error(err);
    }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
    await knex.schema.table('keywords', (table) => { table.dropColumn('type'); });
};
