/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
    return knex.transaction(async (tx1) => {
        // 1. rename the existing fk constraint
        await tx1.raw(`
        alter table grants_saved_searches 
        rename CONSTRAINT grants_saved_searches_created_by_foreign 
        TO grants_saved_searches_created_by_foreign_old;
        `);
        return tx1.transaction(async (tx2) => {
            // 2. create the new cascading fk constraint
            // the NOT VALID marker prevents Postgres from locking out concurrent updates during creation of the constraint.
            await tx2.raw(`
            alter table grants_saved_searches
            add constraint grants_saved_searches_created_by_foreign
            foreign key (created_by) references users(id)
            on delete cascade
            not valid;
            `);
            return tx2.transaction(async (tx3) => {
                // 3. drop the old fk constraint
                await tx3.raw(`
                alter table grants_saved_searches
                drop constraint grants_saved_searches_created_by_foreign_old;
                `);
                return tx3.transaction(async (tx4) => {
                    // 4. validate the new fk constraint
                    await tx4.raw(`
                    alter table grants_saved_searches
                    validate constraint grants_saved_searches_created_by_foreign;
                    `);
                });
            });
        });
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
    return knex.transaction(async (tx1) => {
        await tx1.raw(`
        alter table grants_saved_searches 
        rename CONSTRAINT grants_saved_searches_created_by_foreign 
        TO grants_saved_searches_created_by_foreign_old;
        `);
        return tx1.transaction(async (tx2) => {
            // re-create the old fk constraint (without cascade)
            await tx2.raw(`
            alter table grants_saved_searches
            add constraint grants_saved_searches_created_by_foreign
            foreign key (created_by) references users(id)
            not valid;
            `);
            return tx2.transaction(async (tx3) => {
                await tx3.raw(`
                alter table grants_saved_searches
                drop constraint grants_saved_searches_created_by_foreign_old;
                `);
                return tx3.transaction(async (tx4) => {
                    await tx4.raw(`
                    alter table grants_saved_searches
                    validate constraint grants_saved_searches_created_by_foreign;
                    `);
                });
            });
        });
    });
};
