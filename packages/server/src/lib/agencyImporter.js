const db = require('../db');

class AgencyImporter {
    agencyFromRow(row, adminUser) {
        return {
            name: row.name,
            abbreviation: row.abbreviation,
            parent: this.agencies[row.parent_name].id,
            warning_threshold: Number.parseInt(row.warning_threshold),
            danger_threshold: Number.parseInt(row.danger_threshold),
            main_agency_id: this.main_agency_id,
            tenant_id: adminUser.tenant_id,
            code: row.code,
        };
    }

    checkRow(row, rowIndex) {
        const ret = [];
        const rowNumStr = `Row: ${rowIndex + 2}, `;
        if (!row.name) {
            ret.push(`${rowNumStr}name: Missing name`);
        }
        if (this.agencies[row.name]) {
            ret.push(`${rowNumStr}name: Agency already exists: ${row.name}`);
        }
        if (!row.abbreviation) {
            ret.push(`${rowNumStr}abbreviation: Missing abbreviation`);
        }
        if (!row.code) {
            ret.push(`${rowNumStr}code: Missing code`);
        }
        if (!this.agencies[row.parent_name]) {
            ret.push(`${rowNumStr}parent_name: Can't find parent: ${row.parent_name}`);
        }
        if (!row.warning_threshold) {
            ret.push(`${rowNumStr}warning_threshold: Missing warning_threshold`);
        }
        const warn = Number.parseInt(row.warning_threshold, 10);
        if (Number.isNaN(warn)) {
            ret.push(`${rowNumStr}warning_threshold: should be integer, not ${row.warning_threshold}`);
        } else {
            if (warn < 1) {
                ret.push(`${rowNumStr}warning_threshold: should be greater than zero, not ${row.warning_threshold}`);
            }
        }
        if (!row.danger_threshold) {
            ret.push(`${rowNumStr}danger_threshold: Missing danger_threshold`);
        }
        const danger = Number.parseInt(row.danger_threshold, 10);
        if (Number.isNaN(danger)) {
            ret.push(`${rowNumStr}danger_threshold: should be integer, not ${row.danger_threshold}`);
        } else {
            if (danger < 1) {
                ret.push(`${rowNumStr}danger_threshold: should be greater than zero, not ${row.danger_threshold}`);
            }
        }
        return ret;
    }

    async getAgencies(user) {
        const agenciesArray = await db.getTenantAgencies(user.tenant_id);
        this.agencies = {};
        // eslint-disable-next-line no-restricted-syntax
        for (const agency of agenciesArray) {
            this.agencies[agency.name] = agency;
            if (agency.parent === null) {
                this.main_agency_id = agency.id;
            }
        }
    }

    async import(user, rowsList) {
        const retVal = {
            status: {
                agencies: {
                    added: 0,
                    errored: 0,
                },
                errors: [],
            },
        };
        try {
            await this.getAgencies(user);
            for (let rowIndex = 0; rowIndex < rowsList.length; rowIndex += 1) {
                const theErrors = this.checkRow(rowsList[rowIndex], rowIndex);
                if (theErrors.length > 0) {
                    retVal.status.agencies.errored += 1;
                    retVal.status.errors.push(...theErrors);
                } else {
                    // eslint-disable-next-line no-await-in-loop
                    const agency = this.agencyFromRow(rowsList[rowIndex], user);
                    await db.createAgency(agency, user.id);
                    await this.getAgencies(user);
                    retVal.status.agencies.added += 1;
                }
            }
        } catch (e) {
            console.log(e.toString());
            retVal.status.errors.push(e.toString());
        }
        return retVal;
    }
}

module.exports = AgencyImporter;
