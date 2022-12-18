const XLSX = require('xlsx');
const db = require('../db');
const knex = require('../db/connection');

const ADDED = 0;
const UPDATED = 1;
const NOT_CHANGED = 2;

class UserImporter {
    getRoleId(roleName) {
        if (roleName === 'admin') {
            return this.adminRoleId;
        }
        return this.staffRoleId;
    }

    userFromRow(row, user) {
        return {
            email: row.email,
            name: row.name,
            role_id: this.getRoleId(row.role_name),
            agency_id: this.agencies[row.agency_name].id,
            tenant_id: user.tenant_id,
        };
    }

    checkRow(row, rowIndex) {
        const ret = [];
        const rowNumStr = `Row: ${rowIndex + 2}, `;
        if (!row.email) {
            ret.push(`${rowNumStr}email: Missing email`);
        }
        const validRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
        if (!row.email.match(validRegex)) {
            ret.push(`${rowNumStr}email: Incorrect format: ${row.Email}`);
        }
        if (!row.name) {
            ret.push(`${rowNumStr}name: Missing name`);
        }
        if (!row.role_name) {
            ret.push(`${rowNumStr}role_name: Missing role`);
        }
        if ((row.role_name !== 'admin' && row.role_name !== 'staff')) {
            ret.push(`${rowNumStr}Role: Unknown role_name: ${row.role_name}`);
        }
        if (!row.agency_name) {
            ret.push(`${rowNumStr}Agency: missing Agency`);
        }
        if (!this.agencies[row.agency_name]) {
            ret.push(`${rowNumStr}agency_name: Unknown Agency: ${row.agency_name}`);
        }
        return ret;
    }

    async handleRow(row, adminUser) {
        const newUser = this.userFromRow(row, adminUser);
        const existingUser = this.users[row.email];
        if (existingUser) {
            if ((existingUser.name === row.name)
                && (existingUser.role_id === this.getRoleId(row.role_name))
                && (existingUser.agency_id === this.agencies[row.agency_name].id)
                && (existingUser.tenant_id === adminUser.tenant_id)) {
                return NOT_CHANGED;
            }
            // TODO :update
            return UPDATED;
        }
        await db.createUser(newUser);
        return ADDED;
    }

    static async export(adminUser) {
        const users = await db.getUsers(adminUser.tenant_id);
        const usersForExport = [];
        // eslint-disable-next-line no-restricted-syntax
        for (const user of users) {
            usersForExport.push({
                email: user.email,
                name: user.name,
                role_name: user.role_name,
                agency_name: user.agency_name,
            });
        }
        const workSheet = XLSX.utils.json_to_sheet(usersForExport);
        const workBook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workBook, workSheet, 'Sheet 1');
        return workBook;
    }

    async import(user, workbook) {
        const roles = await knex('roles').select('*');
        this.adminRoleId = roles.find((role) => role.name === 'admin').id;
        this.staffRoleId = roles.find((role) => role.name === 'staff').id;

        const agenciesArray = await db.getTenantAgencies(user.tenant_id);
        this.agencies = {};
        // eslint-disable-next-line no-restricted-syntax
        for (const agency of agenciesArray) {
            this.agencies[agency.name] = agency;
        }
        const usersArray = await db.getUsers(user.tenant_id);
        this.users = {};
        // eslint-disable-next-line no-restricted-syntax
        for (const existingUser of usersArray) {
            this.users[existingUser.email] = existingUser;
        }
        const sheet_name_list = workbook.SheetNames;
        if (sheet_name_list.length > 1) {
            console.log(`More than one sheet (number of sheets: ${sheet_name_list.length}): using first sheet.`);
        }
        const retVal = {
            status: {
                users: {
                    added: 0,
                    updated: 0,
                    notChanged: 0,
                    errored: 0,
                },
                errors: [],
            },
        };
        const rowsList = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);
        for (let rowIndex = 0; rowIndex < rowsList.length; rowIndex += 1) {
            const theErrors = this.checkRow(rowsList[rowIndex], rowIndex);
            if (theErrors.length > 0) {
                retVal.status.users.errored += 1;
                retVal.status.errors.push(...theErrors);
            } else {
                const theStatus = await this.handleRow(rowsList[rowIndex], user);
                if (theStatus === ADDED) {
                    retVal.status.users.added += 1;
                } else if (theStatus === UPDATED) {
                    retVal.status.users.updated += 1;
                } else if (theStatus === NOT_CHANGED) {
                    retVal.status.users.notChanged += 1;
                }
            }
        }
        return retVal;
    }
}

module.exports = UserImporter;
