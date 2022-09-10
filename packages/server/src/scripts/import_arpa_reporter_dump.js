/* eslint-disable */

const _ = require("lodash");
const AdmZip = require("adm-zip");
const mkdirp = require("mkdirp");
const fs = require("fs/promises");

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
    parent: "agencies",
};

function rekeyForeignKeys(row, idLookupByTable, ignoreKeys = []) {
    row = { ...row };

    for (const colName of Object.keys(row)) {
        const fkTable = foreignKeyNames[colName];
        if (!fkTable || ignoreKeys.includes(colName)) {
            continue;
        }

        const colValue = row[colName];

        // Null values are not remapped
        if (colValue === null) {
            continue;
        }

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
        .map((insertedRow, idx) => [rows[idx].id, insertedRow.id])
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
            // TODO: if creating a new main agency, should we also create a new admin user for
            // that agency?
            //
            // TODO: can/should we reuse any of the tenant_creation code from https://github.com/usdigitalresponse/usdr-gost/pull/189
            // for creating tenant and main agency?
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

        inserted.push(tenant);
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
    // First, create all agencies, defaulting their parent and main_agency_id pointers to null (need the
    // rows inserted to know IDs).
    const agenciesToCreate = dbContents.agencies.map((agency) =>
        rekeyForeignKeys(
            {
                tenant_id: agency.tenant_id,
                name: agency.name,
                code: agency.code,
                abbreviation: agency.code,
                parent: null,
                main_agency_id: null,
            },
            idLookupByTable,
            ["main_agency_id", "parent"]
        )
    );
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
        SET main_agency_id = tenants.main_agency_id
        FROM tenants
        WHERE
            agencies.tenant_id = tenants.id
            AND agencies.id in :agencyIds
        `,
        { agencyIds }
    );
    await knex.raw(
        `
        UPDATE agencies
        SET parent = tenants.main_agency_id
        FROM tenants
        WHERE
            agencies.tenant_id = tenants.id
            AND agencies.id in :agencyIds
            AND agencies.id != tenants.main_agency_id
        `,
        { agencyIds }
    );
    inserted = await knex("agencies").select("*").whereIn("id", agencyIds);

    // Tell the user about any new agencies created (not just copied) by this script
    _.chain(dbContents.agencies)
        .filter('__isMainAgency')
        .map('id')
        .map(id => idLookup[id])
        .map(id => inserted.find(agency => agency.id === id))
        .forEach(agency => {
            console.log('Created new main agency', agency.id, 'for new tenant', agency.tenant_id);
        })
        .value();

    return { inserted, idLookup };
}

async function importUsers(dbContents, idLookupByTable, insertedRowsByTable) {
    const roles = await knex('roles').select('*');
    const adminRole = roles.find(r => r.name == 'admin').id;
    const staffRole = roles.find(r => r.name == 'staff').id;

    const mainAgencyByTenant = _.chain(insertedRowsByTable.tenants)
        .keyBy("id")
        .mapValues("main_agency_id")
        .value();
    const usersToCreate = dbContents.users.map((user) =>
        rekeyForeignKeys(
            {
                email: user.email,
                name: user.name,
                // Note: ARPA Reporter had a "reporter" role. For our purposes,
                // anything non-admin becomes "staff"
                role_id: user.role === 'admin' ? adminRole : staffRole,
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

// based on function of the same name in ARPA's services/persist-upload module
// with some adjustments. Ideally, we'd just import it, but this migrate script
// is going to be committed before ARPA's code is copied in.
function uploadFSName(upload) {
    const filename = `${upload.id}${path.extname(upload.filename)}`;
    const DATA_DIR = path.resolve(process.env.DATA_DIR);
    const UPLOAD_DIR = path.join(DATA_DIR, "uploads");
    return path.join(UPLOAD_DIR, filename);
}

// based on function of the same name in ARPA's services/get-template module
// with some adjustments. Ideally, we'd just import it, but this migrate script
// is going to be committed before ARPA's code is copied in.
function periodTemplatePath(reportingPeriod) {
    const DATA_DIR = path.resolve(process.env.DATA_DIR);
    const UPLOAD_DIR = path.join(DATA_DIR, "uploads");
    const PERIOD_TEMPLATES_DIR = path.join(UPLOAD_DIR, "period_templates");
    return path.join(PERIOD_TEMPLATES_DIR, `${reportingPeriod.id}.template`);
}

async function importFiles(
    zipFile,
    dbContents,
    idLookupByTable,
    insertedRowsByTable
) {
    const reverseUploadLookup = _.invert(idLookupByTable.uploads);
    const reversePeriodLookup = _.invert(idLookupByTable.reporting_periods);
    const copies = [
        ...insertedRowsByTable.uploads.map((upload) => ({
            from: path.basename(
                uploadFSName({
                    ...upload,
                    id: reverseUploadLookup[upload.id],
                })
            ),
            to: uploadFSName(upload),
        })),
        ...insertedRowsByTable.reporting_periods
            .filter(
                (reportingPeriod) => reportingPeriod.template_filename !== null
            )
            .map((reportingPeriod) => ({
                from: path.basename(
                    periodTemplatePath({
                        ...reportingPeriod,
                        id: reversePeriodLookup[reportingPeriod.id],
                    })
                ),
                to: periodTemplatePath(reportingPeriod),
            })),
    ];

    for (const { from, to } of copies) {
        await mkdirp(path.dirname(to));
        zipFile.extractEntryTo(
            path.join("files", from),
            path.dirname(to),
            false /* maintainEntryPath */,
            false /* overwrite */,
            path.basename(to)
        );
    }

    return _.map(copies, "to");
}

async function main() {
    console.log(
        "ARPA Reporter dump importer using DB",
        process.env.POSTGRES_URL
    );

    const { inputFilename, outputFilename } = await inquirer.prompt([
        {
            type: "input",
            name: "inputFilename",
            message: "Input zip:",

            // TODO: remove
            default: "/Users/mattb/Desktop/dump.zip",
        },
        {
            type: "input",
            name: "outputFilename",
            message: "Output log JSON:",
            default: `import_arpa_reporter_dump_${new Date()
                .toISOString()
                .replace(/[^0-9]/g, "")}.json`,
        },
    ]);

    const zipFile = new AdmZip(inputFilename);

    const sqlEntry = zipFile.getEntry("sql.json");
    const sqlJson = zipFile.readAsText(sqlEntry);
    const dbContents = JSON.parse(sqlJson);

    console.log("Zip opened successfully");
    console.log("Starting DB import");
    const { idLookupByTable, insertedRowsByTable } = await importDatabase(
        dbContents
    );

    console.log("Importing uploaded files...");
    const createdFiles = await importFiles(
        zipFile,
        dbContents,
        idLookupByTable,
        insertedRowsByTable
    );

    const debugJson = { idLookupByTable, insertedRowsByTable, createdFiles };
    await fs.writeFile(
        outputFilename,
        JSON.stringify(debugJson, undefined, 2),
        { encoding: "utf8", flag: "w" }
    );

    console.log("Done!");
    console.log("Remember to delete ZIP and JSON files when you're done!", {
        inputFilename,
        outputFilename,
    });
}

if (require.main === module) {
    main().then(() => process.exit());
}
