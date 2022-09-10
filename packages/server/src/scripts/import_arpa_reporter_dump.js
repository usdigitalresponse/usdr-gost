/* eslint-disable */

require("dotenv").config();

const _ = require("lodash");
const AdmZip = require("adm-zip");
const mkdirp = require("mkdirp");
const fs = require("fs/promises");
const path = require("path");
const { validate: validateEmail } = require("email-validator");
const inquirer = require("inquirer");
inquirer.registerPrompt("search-list", require("inquirer-search-list"));

// This is so named to keep from accidentally typing "knex" out of habit and thus having some
// queries inadvertently outside the transaction.
const knexWithoutTransaction = require("../db/connection");

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

function rekeyForeignKeys(tableName, row, idLookupByTable, ignoreKeys = []) {
    // Make a copy so we don't mutate the original
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

    // This function is used to prepare rows for insertion to the DB, where they will get new IDs
    // Instead of calling _.omit(row, "id") at every callsite, just drop the ID field here.
    delete row.id;

    return row;
}

async function importTable(
    tableName,
    rows,
    idLookupByTable,
    insertedRowsByTable,
    trns = knexWithoutTransaction
) {
    if (rows.length === 0) {
        return { inserted: [], idLookup: {} };
    }

    const rowsToInsert = rows.map((row) =>
        rekeyForeignKeys(tableName, row, idLookupByTable)
    );

    const inserted = await trns(tableName).insert(rowsToInsert).returning("*");
    const idLookup = _.chain(inserted)
        .filter(
            // NOTE: ARPA Reporter has one table, application_settings, that doesn't have an id column.
            (row) => "id" in row
        )
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

async function importTenants(
    dbContents,
    idLookupByTable,
    insertedRowsByTable,
    trns = knexWithoutTransaction
) {
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

        const tenant = await trns("tenants")
            .insert({
                display_name: tenantName,
                // main_agency_id must be populated in a second pass in importAgencies
                // because there is a circular FK between tenants/agencies tables
                main_agency_id: null,
            })
            .returning("*")
            .then((rows) => rows[0]);

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
    insertedRowsByTable,
    trns = knexWithoutTransaction
) {
    // main_agency_id is non-nullable, so we need to init agencies with a main_agency_id of some value,
    // even though we're going to overwrite it after insert. Since it's a FK, that value has to correspond
    // to a real row.
    //
    // TODO(mbroussard): should we remove the NOT NULL constraint and have null mean root
    // agency vs. having self-loops (similar to parent field)?
    const someExistingAgencyId = await trns("agencies")
        .first("id")
        .then((row) => row.id);

    // First, create all agencies, defaulting their parent and main_agency_id pointers to null (need the
    // rows inserted to know IDs).
    const agenciesToCreate = dbContents.agencies.map((agency) =>
        rekeyForeignKeys(
            "agencies",
            {
                tenant_id: agency.tenant_id,
                name: agency.name,
                code: agency.code,
                abbreviation: agency.code,
                parent: null,
                main_agency_id: someExistingAgencyId,
                // Note: id field gets dropped by rekeyForeignKeys, but is useful for debug logging
                // if the rekey fails
                id: agency.id,
            },
            idLookupByTable
        )
    );
    let inserted = await trns("agencies")
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
        await trns("tenants")
            .where("id", tenant.id)
            .update({ main_agency_id: mainAgencyId });
    }

    // Then update any non-main agencies to be parented by their tenant's main agency (since
    // standalone ARPA Reporter did not have a concept of parent agencies)
    const agencyIds = _.map(inserted, "id");
    const tenantsById = _.keyBy(insertedRowsByTable.tenants, "id");
    await Promise.all(
        inserted.map((agency) => {
            const mainAgencyId = tenantsById[agency.tenant_id].main_agency_id;
            return trns("agencies")
                .where("id", agency.id)
                .update({
                    main_agency_id: mainAgencyId,
                    // Main agencies have no parent; non-main agencies have their main
                    // agency as parent.
                    parent: mainAgencyId === agency.id ? null : mainAgencyId,
                });
        })
    );
    inserted = await trns("agencies").select("*").whereIn("id", agencyIds);

    // Tell the user about any new agencies created (not just copied) by this script
    _.chain(dbContents.agencies)
        .filter("__isMainAgency")
        .map("id")
        .map((id) => idLookup[id])
        .map((id) => inserted.find((agency) => agency.id === id))
        .forEach((agency) => {
            console.log(
                "Created new main agency",
                agency.id,
                "for new tenant",
                agency.tenant_id
            );
        })
        .value();

    return { inserted, idLookup };
}

async function emailExists(email, trns = knexWithoutTransaction) {
    const rows = await trns("users").select("id").where("email", email);
    return rows.length !== 0;
}

function getDefaultEmailReassignment(user) {
    const { email, tenant_id } = user;
    const hint = `tenant${user.tenant_id}`;

    // These domains support plus-addressing, so suggest an email with a plus address
    const domains = ["gmail\\.com", "usdigitalresponse\\.org"];
    const c = "[a-z0-9_.-]";
    const regex = new RegExp(`^${c}+(\\+${c}+)?@(${domains.join("|")})$`, "i");
    const matches = user.email.match(regex);
    if (!matches) {
        return undefined;
    }

    const plusAddr = matches[1];
    if (plusAddr) {
        return email.replace(plusAddr, `${plusAddr}-${hint}`);
    }

    return email.replace("@", `+${hint}@`);
}

async function reassignDuplicateUserEmailsIfNeeded(
    usersToCreate,
    trns = knexWithoutTransaction
) {
    const usersWithDupeEmails = await trns("users")
        .select("email")
        .whereIn("email", _.map(usersToCreate, "email"));
    if (usersWithDupeEmails.length === 0) {
        return usersToCreate;
    }

    console.error(
        "Found",
        usersWithDupeEmails.length,
        "duplicate emails; you must reassign different emails for these users."
    );

    // NOTE: we must do this sequentially, not in a Promise.all, because only one
    // inquirer prompt can run at a time
    // TODO: maybe cleaner to build a questions list ahead of time then call inquirer once?
    let ret = [];
    for (const user of usersToCreate) {
        if (!usersWithDupeEmails.find((u) => u.email === user.email)) {
            ret.push(user);
            continue;
        }

        const { newEmail } = await inquirer.prompt([
            {
                type: "input",
                name: "newEmail",
                message: `New email for ${user.email}:`,
                filter: (e) => e.toLowerCase(),
                validate: async (email) => {
                    if (!validateEmail(email)) {
                        return "Invalid email";
                    }

                    if (await emailExists(email)) {
                        return `Email ${email} also already exists`;
                    }

                    return true;
                },
                default: getDefaultEmailReassignment(user),
            },
        ]);

        ret.push({ ...user, email: newEmail });
    }

    return ret;
}

async function importUsers(
    dbContents,
    idLookupByTable,
    insertedRowsByTable,
    trns = knexWithoutTransaction
) {
    const roles = await trns("roles").select("*");
    const adminRole = roles.find((r) => r.name == "admin").id;
    const staffRole = roles.find((r) => r.name == "staff").id;

    const mainAgencyByTenant = _.chain(insertedRowsByTable.tenants)
        .keyBy("id")
        .mapValues("main_agency_id")
        .value();
    let usersToCreate = dbContents.users.map((user) =>
        rekeyForeignKeys(
            "users",
            {
                email: user.email,
                name: user.name,
                // Note: ARPA Reporter had a "reporter" role. For our purposes,
                // anything non-admin becomes "staff"
                role_id: user.role === "admin" ? adminRole : staffRole,
                tenant_id: user.tenant_id,
                // Copied users belong to the main agency of their tenant
                // TODO: is that right? should we be only doing that for users with null agency ID in ARPA?
                agency_id:
                    mainAgencyByTenant[idLookupByTable.tenants[user.tenant_id]],
                // Note: id field gets dropped by rekeyForeignKeys, but is useful for debug logging
                // if the rekey fails
                id: user.id,
            },
            idLookupByTable,
            ["agency_id"]
        )
    );

    // Check if there are any existing users with the specified emails
    usersToCreate = await reassignDuplicateUserEmailsIfNeeded(
        usersToCreate,
        trns
    );

    // Do the inserts
    const inserted = await trns("users").insert(usersToCreate).returning("*");
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

async function importDatabase(dbContents, trns = knexWithoutTransaction) {
    const idLookupByTable = _.fromPairs(
        TABLES.map((tableName) => [tableName, {}])
    );
    const insertedRowsByTable = _.fromPairs(
        TABLES.map((tableName) => [tableName, []])
    );

    for (const tableName of TABLES) {
        console.log("Importing table", tableName, "...");

        const specialHandler = specialTableHandlers[tableName];
        const { inserted, idLookup } = specialHandler
            ? await specialHandler(
                  dbContents,
                  idLookupByTable,
                  insertedRowsByTable,
                  trns
              )
            : await importTable(
                  tableName,
                  dbContents[tableName],
                  idLookupByTable,
                  insertedRowsByTable,
                  trns
              );

        Object.assign(idLookupByTable[tableName], idLookup);
        insertedRowsByTable[tableName] =
            insertedRowsByTable[tableName].concat(inserted);
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
    insertedRowsByTable,
    dryRun = false
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

    if (!dryRun) {
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
    }

    return _.map(copies, "to");
}

async function main() {
    if (!process.env.POSTGRES_URL) {
        console.error("must specify POSTGRES_URL env variable");
        return;
    }
    console.log(
        "ARPA Reporter dump importer using DB",
        process.env.POSTGRES_URL
    );

    const { inputFilename, outputFilename, dryRun } = await inquirer.prompt([
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
            default: (answers) => {
                const fname = `import_arpa_reporter_dump_${new Date()
                    .toISOString()
                    .replace(/[^0-9]/g, "")}.json`;
                const { dir } = path.parse(answers.inputFilename);
                return path.join(dir, fname);
            },
        },
        {
            type: "list",
            name: "dryRun",
            message: "Mode:",
            choices: [
                {
                    value: true,
                    name: "Dry run (rolls back transaction & files not actually extracted)",
                },
                { value: false, name: "Commit" },
            ],
            default: true,
        },
    ]);

    const zipFile = new AdmZip(inputFilename);

    const sqlEntry = zipFile.getEntry("sql.json");
    const sqlJson = zipFile.readAsText(sqlEntry);
    const dbContents = JSON.parse(sqlJson);

    console.log("Zip opened successfully");
    console.log("Starting DB import");

    let rollbackExpected = false;
    let idLookupByTable;
    let insertedRowsByTable;
    await knexWithoutTransaction
        .transaction(async (trns) => {
            ({ idLookupByTable, insertedRowsByTable } = await importDatabase(
                dbContents,
                trns
            ));

            if (dryRun) {
                rollbackExpected = true;
                throw new Error("intentional rollback for dryRun mode");
            }
        })
        .catch((err) => {
            if (!rollbackExpected) {
                throw err;
            } else {
                console.log("Dry run mode: transaction rolled back");
            }
        });

    console.log("Importing uploaded files...");
    const createdFiles = await importFiles(
        zipFile,
        dbContents,
        idLookupByTable,
        insertedRowsByTable,
        dryRun
    );

    const debugJson = {
        dryRun,
        inputFilename,
        idLookupByTable,
        insertedRowsByTable,
        createdFiles,
    };
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
