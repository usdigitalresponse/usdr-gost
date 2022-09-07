/* eslint-disable */

const _ = require("lodash");
const AdmZip = require("adm-zip");

const inquirer = require("inquirer");
inquirer.registerPrompt("search-list", require("inquirer-search-list"));

const knex = require("../db/connection");

const TABLES = [
    // This table does not exist in the dump, but we create rows in GOST's based on tenant_ids seen
    // in the dump. Most/all of the other tables have tenant_id FKs, so this one also has to be done
    // first.
    "tenants",

    // Table names that existed in both ARPA and GOST
    "agencies",
    "users",

    // Purely ARPA Reporter tables
    "reporting_periods",
    "uploads", // has FK to reporting_periods
    "arpa_subrecipients", // has FK to uploads
    "application_settings", // has FK to reporting_periods
    "projects", // has FK to reporting_periods
    "period_summaries", // has FK to reporting_periods, projects
];

// foreign key column name -> table whose "id" column it refers to
const foreignKeyNames = {
    reporting_period_id: "reporting_periods",
    current_reporting_period_id: "reporting_periods",
    created_in_period: "reporting_periods",
    updated_by: "users",
    upload_id: "uploads",
    agency_id: "agencies",
    user_id: "users",
    validated_by: "users",
    tenant_id: "tenants",
};

function rekeyForeignKeys(row, idLookupByTable, ignoreKeys = []) {
    row = { ...row };

    for (const colName of Object.keys(row)) {
        const fkTable = foreignKeyNames[colName];
        if (!fkTable || ignoreKeys.includes(colName)) {
            continue;
        }

        const colValue = row[colName];
        const fkValue = idLookupByTable[fkTable][colValue];
        if (fkValue === undefined) {
            throw new Error(
                `could not update foreign key: ${tableName}.${colName}=${colValue} -> ${fkTable}.id on row ${tableName}.id=${row.id}`
            );
        }

        row[colName] = fkValue;
    }

    return row;
}

async function importTable(tableName, rows, idLookupByTable) {
    console.log("Importing table", tableName, "...");

    const rowsToInsert = rows.map((row) =>
        rekeyForeignKeys(_.omit(row, "id"), idLookupByTable)
    );

    const inserted = await knex(tableName).insert(rowsToInsert).returning("*");
    const idLookup = _.chain(inserted)
        .map((insertedRow, idx) => [rowsToInsert[idx].id, insertedRow.id])
        .fromPairs()
        .value();

    return { inserted, idLookup };
}

function getAllTenantIds(dbContents) {
    return _.chain(dbContents)
        .values()
        .flatten()
        .map("tenant_id")
        .uniq()
        .filter((x) => x !== undefined)
        .sort()
        .value();
}

async function importTenants(dbContents, idLookupByTable) {
    // First, we ask users for tenant names and main agencies for all tenants that
    // will be created (this should be just one, but technically could be more than
    // one, so we have to account for it here)
    const allTenantIds = getAllTenantIds(dbContents);
    const agencyOptionsByTenantId = _.fromPairs(
        allTenantIds.map((tenantId) => [
            tenantId,
            dbContents.agencies.filter(
                (agency) => agency.tenant_id === tenantId
            ),
        ])
    );
    const questions = _.chain(allTenantIds)
        .map((tenantId) => [
            {
                type: "input",
                name: `tenantNames.${tenantId}`,
                message: `Tenant name for source tenant ${tenantId}`,
                validate: (name) =>
                    name.trim().length > 0 || "must enter a name",
            },
            {
                type: "search-list",
                name: `mainAgencies.${tenantId}`,
                message: `Main agency for source tenant ${tenantId}`,
                choices: [
                    {
                        name: "(create new agency with same name as tenant)",
                        value: null,
                    },
                    ...agencyOptionsByTenantId[tenantId].map((agency) => ({
                        name: agency.name,
                        value: agency.id,
                    })),
                ],
            },
        ])
        .flatten()
        .value();
    let { tenantNames, mainAgencies } = await inquirer.prompt(questions);

    // Annoying: by default Inquirer will make (sparse) arrays instead of objects; convert them back
    // to the expected form.
    tenantNames = _.fromPairs(
        tenantNames
            .filter((x) => x !== undefined)
            .map((name, idx) => [idx, name])
    );
    mainAgencies = _.fromPairs(
        mainAgencies
            .filter((x) => x !== undefined)
            .map((agencyId, idx) => [idx, agencyId])
    );

    // Create tenants
    let inserted = [];
    for (const tenantId of allTenantIds) {
        const tenantName = tenantNames[tenantId];
        const mainAgencyId = mainAgencies[tenantId];

        const tenant = await knex("tenants")
            .insert({
                display_name: tenantName,
                // main_agency_id must be populated in a second pass in importAgencies
                // because there is a circular FK between tenants/agencies tables
                main_agency_id: null,
            })
            .returning("*");
        inserted.push(tenant);

        if (mainAgencyId) {
            tenant.__unmappedFutureMainAgencyId = mainAgencyId;
        } else {
            const agencyToInsert = {
                id: 1000000 + tenantId,
                tenant_id: tenantId,
                name: tenantName,
                code: `CHANGEME_${tenant.id}`,
                __isMainAgency: true,
            };
            dbContents.agencies.splice(0, 0, agencyToInsert);
            tenant.__unmappedFutureMainAgencyId = agencyToInsert.id;
        }
    }

    const idLookup = _.chain(inserted)
        .map((insertedRow, idx) => [allTenantIds[idx], insertedRow.id])
        .fromPairs()
        .value();

    return { inserted, idLookup };
}

async function importAgencies(
    dbContents,
    idLookupByTable,
    insertedRowsByTable
) {
    // First, create all agencies, defaulting their parent pointer to point to themselves.
    const agenciesToCreate = dbContents.agencies.map((agency) => ({
        tenant_id: agency.tenant_id,
        name: agency.name,
        code: agency.code,
        abbreviation: agency.code,
        parent: knex.ref("id"),
        main_agency_id: knex.ref("id"),
    }));
    let inserted = await knex("agencies")
        .insert(agenciesToCreate)
        .returning("*");
    const idLookup = _.chain(inserted)
        .map((insertedRow, idx) => [
            dbContents.agencies[idx].id,
            insertedRow.id,
        ])
        .fromPairs()
        .value();

    // Then update main_agency_id on tenant rows
    for (const tenant of insertedRowsByTable.tenants) {
        const mainAgencyId = idLookup[tenant.__unmappedFutureMainAgencyId];
        tenant.main_agency_id = mainAgencyId;
        await knex("tenants")
            .where("id", tenant.id)
            .update({ main_agency_id: mainAgencyId });
    }

    // Then update any non-main agencies to be parented by their tenant's main agency (since
    // standalone ARPA Reporter did not have a concept of parent agencies)
    const agencyIds = _.map(inserted, "id");
    await knex.raw(
        `
        UPDATE agencies
        SET
            parent = tenants.main_agency_id,
            main_agency_id = tenants.main_agency_id,
        FROM tenants
        WHERE
            agencies.tenant_id = tenants.id
            AND agencies.id in :agencyIds
    `,
        { agencyIds }
    );
    inserted = await knex("agencies").select("*").whereIn("id", agencyIds);

    return { inserted, idLookup };
}

async function importUsers(dbContents, idLookupByTable, insertedRowsByTable) {
    const mainAgencyByTenant = _.chain(insertedRowsByTable.tenants)
        .keyBy("id")
        .mapValues("main_agency_id")
        .value();
    const usersToCreate = dbContents.users.map((user) =>
        rekeyForeignKeys(
            {
                email: user.email,
                name: user.name,
                role_id: 1,
                tenant_id: user.tenant_id,
                // Copied users belong to the main agency of their tenant
                agency_id:
                    mainAgencyByTenant[idLookupByTable.tenants[user.tenant_id]],
            },
            idLookupByTable,
            ["agency_id"]
        )
    );

    // Check if there are any existing users with the specified emails
    const usersWithDupeEmails = await knex("users")
        .select("email")
        .whereIn("email", _.map(usersToCreate, "email"));
    if (usersWithDupeEmails.length != 0) {
        console.error(
            "Found duplicate emails",
            _.map(usersWithDupeEmails, "email")
        );
        throw new Error(
            "found users with duplicate emails! Delete them first, or update script to handle."
        );
    }

    // Do the inserts
    const inserted = await knex("users").insert(usersToCreate).returning("*");
    const idLookup = _.chain(inserted)
        .map((insertedRow, idx) => [dbContents.users[idx].id, insertedRow.id])
        .fromPairs()
        .value();

    return { inserted, idLookup };
}

const specialTableHandlers = {
    tenants: importTenants,
    users: importUsers,
    agencies: importAgencies,
};

async function importDatabase(dbContents) {
    const idLookupByTable = {};
    const insertedRowsByTable = {};

    for (const tableName of TABLES) {
        console.log("Importing table", tableName, "...");

        const specialHandler = specialTableHandlers[tableName];
        const { inserted, idLookup } = specialHandler
            ? await specialHandler(
                  dbContents,
                  idLookupByTable,
                  insertedRowsByTable
              )
            : await importTable(
                  tableName,
                  dbContents[tableName],
                  idLookupByTable,
                  insertedRowsByTable
              );

        idLookupByTable[tableName] = {
            ...idLookupByTable[tableName],
            ...idLookup,
        };
        insertedRowsByTable[tableName] = [
            ...insertedRowsByTable[tableName],
            ...inserted,
        ];
    }

    return { idLookupByTable, insertedRowsByTable };
}

async function main() {
    console.log(
        "ARPA Reporter dump importer using DB",
        process.env.POSTGRES_URL
    );

    const { inputFilename } = await inquirer.prompt([
        {
            type: "input",
            name: "inputFilename",
            message: "Input zip:",

            // TODO: remove
            default: "/Users/mattb/Desktop/dump.zip",
        },
    ]);

    const zipFile = new AdmZip(inputFilename);

    const sqlEntry = zipFile.getEntry("sql.json");
    const sqlJson = zipFile.readAsText(sqlEntry);
    const dbContents = JSON.parse(sqlJson);

    console.log("Zip opened successfully; starting DB import");
    await importDatabase(dbContents);

    // TODO: handled uploaded files
}

if (require.main === module) {
    main().then(() => process.exit());
}
