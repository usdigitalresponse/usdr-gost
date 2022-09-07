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
    "users",
    "agencies",

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

async function importTable(tableName, rows, idLookupByTable) {
    const rowsToInsert = rows.map((row) => {
        const toInsert = { ...row };

        for (const colName of Object.keys(toInsert)) {
            const fkTable = foreignKeyNames[colName];
            if (!fkTable) {
                continue;
            }

            const colValue = toInsert[colName];
            const fkValue = idLookupByTable[fkTable][colValue];
            if (fkValue === undefined) {
                throw new Error(
                    `could not update foreign key: ${tableName}.${colName}=${colValue} -> ${fkTable}.id on row ${tableName}.id=${toInsert.id}`
                );
            }

            toInsert[colName] = fkValue;
        }

        delete toInsert.id;
    });

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
    // const allTenantIds = getAllTenantIds(dbContents);
    const allTenantIds = [2, 3, 4];
    const agencyOptionsByTenantId = _.fromPairs(
        allTenantIds.map((tenantId) => [
            tenantId,
            dbContents.agencies.filter(
                (agency) => agency.tenant_id === tenantId
            ),
        ])
    );
    const defaultMainAgency = {
        name: "(create new agency with same name as tenant)",
        value: null,
    };
    const questions = _.chain(allTenantIds)
        .map((tenantId) => [
            {
                type: "input",
                name: `tenantNames.${tenantId}`,
                message: `Tenant name for source tenant ${tenantId}`,
            },
            {
                type: "search-list",
                name: `mainAgencies.${tenantId}`,
                message: `Main agency for source tenant ${tenantId}`,
                choices: [
                    defaultMainAgency,
                    ...agencyOptionsByTenantId[tenantId].map((agency) => ({
                        name: agency.name,
                        value: agency.id,
                    })),
                ],
                default: null, // defaultMainAgency,
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

    console.log({ tenantNames, mainAgencies });
    throw new Error("not implemented");
}

async function importUsers(dbContents, idLookupByTable) {
    throw new Error("not implemented");
}

const specialTableHandlers = {
    tenants: importTenants,
    users: importUsers,
};

async function importDatabase(dbContents) {
    const idLookupByTable = {};
    const insertedRowsByTable = {};

    for (const tableName of TABLES) {
        console.log("Importing table", tableName, "...");

        const specialHandler = specialTableHandlers[tableName];
        const { inserted, idLookup } = specialHandler
            ? await specialHandler(dbContents, idLookupByTable)
            : await importTable(
                  tableName,
                  dbContents[tableName],
                  idLookupByTable
              );

        idLookupByTable[tableName] = idLookup || {};
        insertedRowsByTable[tableName] = inserted || [];
    }

    return { idLookupByTable, insertedRowsByTable };
}

async function main() {
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
}

if (require.main === module) {
    main().then(() => process.exit());
}
