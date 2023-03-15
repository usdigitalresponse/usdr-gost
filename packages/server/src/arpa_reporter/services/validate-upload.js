const moment = require('moment');

const { getReportingPeriod } = require('../db/reporting-periods');
const {
    setAgencyId, setEcCode, markValidated, markNotValidated,
} = require('../db/uploads');
const knex = require('../../db/connection');
const { agencyByCode } = require('../../db/arpa_reporter_db_shims/agencies');
const { createRecipient, findRecipient, updateRecipient } = require('../db/arpa-subrecipients');

const { recordsForUpload, TYPE_TO_SHEET_NAME } = require('./records');
const { getRules } = require('./validation-rules');
const { ecCodes } = require('../lib/arpa-ec-codes');

const ValidationError = require('../lib/validation-error');

// Currency strings are must be at least one digit long (\d+)
// They can optionally have a decimal point followed by 1 or 2 more digits (?: \.\d{ 1, 2 })
const CURRENCY_REGEX_PATTERN = /^\d+(?: \.\d{ 1, 2 })?$/g;

// Copied from www.emailregex.com
const EMAIL_REGEX_PATTERN = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

const BETA_VALIDATION_MESSAGE = '[BETA] This is a new validation that is running in beta mode (as a warning instead of a blocking error). If you see anything incorrect about this validation, please report it at grants-helpdesk@usdigitalresponse.org';

// This maps from field name to regular expression that must match on the field.
// Note that this only covers cases where the name of the field is what we want to match on.
const FIELD_NAME_TO_PATTERN = {
    POC_Email_Address__c: { pattern: EMAIL_REGEX_PATTERN, explanation: 'Email must be of the form "user@email.com"' },
};

// This is a convenience wrapper that lets us use consistent behavior for new validation errors.
// Specifically, all new validations should have a message explaining they are in beta and errors
// should be reported to us. The validation should also be a warning (not a blocking error) until
// it graduates out of beta
function betaValidationWarning(message) {
    return new ValidationError(`${message} -- ${BETA_VALIDATION_MESSAGE}`, { severity: 'warn' });
}

function validateFieldPattern(fieldName, value) {
    let error = null;
    const matchedFieldPatternInfo = FIELD_NAME_TO_PATTERN[fieldName];
    if (matchedFieldPatternInfo) {
        const { pattern } = matchedFieldPatternInfo;
        const { explanation } = matchedFieldPatternInfo;
        if (value && typeof value === 'string' && !value.match(pattern)) {
            error = new Error(
                `Value entered in cell is "${value}". ${explanation}`,
            );
        }
    }
    return error;
}

/**
 * Derive the agency id from the upload and the cover sheet
 * @param {object} recordFromUploadsTable - the record from the uploads table
 * @param {object} coverSheetAgency - the agency from the cover sheet
 * @returns {Promise<void>|ValidationError}
*/
async function setOrValidateAgencyBasedOnCoverSheet(recordFromUploadsTable, coverSheetAgency) {
    // grab agency id from the upload, if it exists
    const uploadRecordAgencyId = recordFromUploadsTable.agency_id;

    if (uploadRecordAgencyId == null) {
        // if the upload doesn't have an agency id, set it to the agency id from the cover sheet
        await setAgencyId(recordFromUploadsTable.id, coverSheetAgency.id);
    } else if (uploadRecordAgencyId !== coverSheetAgency.id) {
        // if the upload already has an agency id, it must match the agency id from the cover sheet
        return new ValidationError(
            `The agency on the spreadsheet, "${coverSheetAgency.code}", does not match the agency provided in the form, "${recordFromUploadsTable.agency_code}"`,
            { tab: 'cover', row: 2, col: 'A' },
        );
    }
    return undefined;
}

/**
 * Validate the agencyId for the upload
 * @param {object} upload - the record from the uploads table
 * @param {object} records - the rows from the workbook
 * @param {object} trns - the transaction to use for db queries
 * @returns {Promise<void>|ValidationError}
*/
async function validateAgencyId({ upload: recordFromUploadsTable, records: workbookRows, trns }) {
    // grab agency id from the cover sheet
    const coverSheet = workbookRows.find((doc) => doc.type === 'cover').content;
    const coverAgencyCode = coverSheet['Agency Code'];

    // must be set
    if (!coverAgencyCode) {
        return new ValidationError('Agency code must be set', { tab: 'cover', row: 1, col: 'A' });
    }

    // must exist in the db
    const coverSheetAgency = (await agencyByCode(coverAgencyCode, trns))[0];
    if (!coverSheetAgency) {
        return new ValidationError(
            `Agency code ${coverAgencyCode} does not match any known agency`,
            { tab: 'cover', row: 2, col: 'A' },
        );
    }
    return setOrValidateAgencyBasedOnCoverSheet(recordFromUploadsTable, coverSheetAgency);
}

async function validateEcCode({ upload, records }) {
    // grab ec code string from cover sheet
    const coverSheet = records.find((doc) => doc.type === 'cover').content;
    const codeString = coverSheet['Detailed Expenditure Category'];

    if (!codeString) {
        return new ValidationError(
            'EC code must be set',
            { tab: 'cover', row: 2, col: 'D' },
        );
    }

    const codeParts = codeString.split('-');
    const code = codeParts[0];

    if (!ecCodes[code]) {
        return new ValidationError(
            `Record EC code ${code} from entry ${codeString} does not match any known EC code`,
            {
                tab: 'cover', row: 2, col: 'D', severity: 'err',
            },
        );
    }

    // always set EC code if possible; we omit passing the transaction in this
    // case, so that the code gets set even if the upload fails to validate
    if (code !== upload.ec_code) {
        await setEcCode(upload.id, code);
        upload.ec_code = code;
    }

    return undefined;
}

async function validateVersion({ records, rules }) {
    const logicSheet = records.find((record) => record.type === 'logic').content;
    const { version } = logicSheet;

    const versionRule = rules.logic.version;

    let error = null;
    if (version < versionRule.version) {
        error = 'older';
    } else if (version > versionRule.version) {
        error = 'newer';
    }

    if (error) {
        return new ValidationError(
            `Upload template version (${version}) is ${error} than the latest input template (${versionRule.version})`,
            {
                tab: 'logic',
                row: 1,
                col: versionRule.columnName,
                severity: 'warn',
            },
        );
    }

    return undefined;
}

async function validateReportingPeriod({ upload, records, trns }) {
    const uploadPeriod = await getReportingPeriod(upload.reporting_period_id, trns);
    const coverSheet = records.find((record) => record.type === 'cover').content;
    const errors = [];

    const periodStart = moment(uploadPeriod.start_date);
    const sheetStart = moment(coverSheet['Reporting Period Start Date']);
    if (!periodStart.isSame(sheetStart)) {
        errors.push(
            new ValidationError(
                `The "${
                    uploadPeriod.name
                }" upload reporting period starts ${periodStart.format(
                    'L',
                )} while the cell in the uploaded workbook specifies ${sheetStart.format(
                    'L',
                )}`,
                { tab: 'cover', row: 2, col: 'E' },
            ),
        );
    }

    const periodEnd = moment(uploadPeriod.end_date);
    const sheetEnd = moment(coverSheet['Reporting Period End Date']);
    if (!periodEnd.isSame(sheetEnd)) {
        errors.push(
            new ValidationError(
                `The "${
                    uploadPeriod.name
                }" upload reporting period ends ${periodEnd.format(
                    'L',
                )} while the cell in the uploaded workbook specifies ${sheetEnd.format(
                    'L',
                )}`,
                { tab: 'cover', row: 2, col: 'F' },
            ),
        );
    }

    return errors;
}

/**
 * Check whether UEI is required for the recipient
 * @param {object} recipient - the recipient record
 * @returns {boolean} - true if UEI is required, false otherwise
 */
function isUEIRequired(recipient) {
    // As of Q1, 2023 we require a UEI for all entities of type subrecipient and/or contractor
    return (recipient.Entity_Type_2__c.includes('Contractor') || recipient.Entity_Type_2__c.includes('Subrecipient'));
}

/**
 * Validate the recipient's identifier
 * @param {object} recipient - the recipient record
 * @returns {Array<ValidationError>} - an array of validation errors if found
*/
function validateIdentifier(recipient) {
    const errors = [];
    // As of Q1, 2023 we require a UEI for all entities of type subrecipient and/or contractor
    // See https://github.com/usdigitalresponse/usdr-gost/issues/1027

    // This is a multi-select field, so we need to check for substring matches
    if (isUEIRequired(recipient)) {
        if (!recipient.Unique_Entity_Identifier__c) {
            errors.push(new ValidationError(
                'UEI is required for all subrecipients and contractors',
                { col: 'C', severity: 'err' },
            ));
        }
    } else if (recipient.Entity_Type_2__c.includes('Beneficiary')) {
        if (!recipient.EIN__c && !recipient.Unique_Entity_Identifier__c) {
        // If this entity is not a subrecipient or contractor, then it must have a TIN OR a UEI (same as the old logic)
            errors.push(new ValidationError(
                'At least one of UEI or TIN/EIN must be set for benficiaries, but both are missing',
                { col: 'C, D', severity: 'err' },
            ));
        }
    }
    return errors;
}

async function validateSubrecipientRecord({
    upload, record: recipient, recordErrors, trns,
}) {
    const errors = [];

    errors.concat(validateIdentifier(recipient));

    // does the row already exist?
    let byUei = null;
    if (recipient.Unique_Entity_Identifier__c) {
        byUei = await findRecipient(recipient.Unique_Entity_Identifier__c, null, trns);
    }

    let byTin = null;
    if (recipient.EIN__c) {
        byTin = await findRecipient(null, recipient.EIN__c, trns);
    }

    // did we find two different subrecipients?
    if (byUei && byTin && byUei.id !== byTin.id) {
        errors.push(new ValidationError(
            'We already have a sub-recipient with given UEI, and a different one with given TIN/EIN',
            { col: 'C, D', severity: 'warn' },
        ));
    }

    const existing = byUei || byTin;

    // if the current upload owns the recipient, we can actually update it
    let isOwnedByThisUpload = true;
    if (
        !existing
    || existing.upload_id !== upload.id
    || existing.updated_at
    ) isOwnedByThisUpload = false;

    // the record has already been validated before this method was invoked, or we found an error above. how did the validation go?
    const isRecordValid = recordErrors.length === 0 && errors.length === 0;

    // validate that existing record and given recipient match
    //
    // TODO: what if the same upload specifies the same recipient multiple times,
    // but different?
    if (existing) {
        // if we own it, we can just update it
        if (isOwnedByThisUpload) {
            if (isRecordValid) {
                await updateRecipient(existing.id, { record: recipient }, trns);
            }

        // if there is no UEI on the existing record, then we need to update it to match treasury requirements
        } else if (isUEIRequired(recipient) && !byUei) {
            await updateRecipient(existing.id, { record: recipient }, trns);
        }

        // const recipientId = existing.uei || existing.tin;
        // const record = JSON.parse(existing.record);

        /* Based on feedback from partners on 12/22/22, these warning are not helpful, and create
         such a high volume of warnings that it is drowning out other more valid warnings.
      // make sure that each key in the record matches the recipient
      for (const [key, rule] of Object.entries(rules)) {
        if ((record[key] || recipient[key]) && record[key] !== recipient[key]) {
          errors.push(new ValidationError(
            `Subrecipient ${recipientId} exists with '${rule.humanColName}' as '${record[key]}', \
            but upload specifies '${recipient[key]}'`,
            { col: rule.columnName, severity: 'warn' }
          ))
        }
      }
      */
        // if it's new, and it's passed validation, then insert it
    } else if (isRecordValid) {
        const dbRow = {
            uei: recipient.Unique_Entity_Identifier__c,
            tin: recipient.EIN__c,
            record: recipient,
            upload_id: upload.id,
        };
        await createRecipient(dbRow, trns);
    }

    return errors;
}

async function validateRecord({ upload, record, typeRules: rules }) {
    // placeholder for rule errors we're going to find
    const errors = [];

    // check all the rules
    for (const [key, rule] of Object.entries(rules)) {
    // if the rule only applies on different EC codes, skip it
        if (rule.ecCodes && (!upload.ec_code || !rule.ecCodes.includes(upload.ec_code))) {
            // eslint-disable-next-line no-continue
            continue;
        }

        // if the field is unset/missing/blank, is that okay?
        // we don't treat numeric `0` as unset
        if ([undefined, null, ''].includes(record[key])) {
            // make sure required keys are present
            if (rule.required === true) {
                errors.push(new ValidationError(
                    `Value is required for ${key}`,
                    { col: rule.columnName, severity: 'err' },
                ));
            } else if (rule.required === 'Conditional') {
                if (rule.isRequiredFn && rule.isRequiredFn(record)) {
                    errors.push(new ValidationError(
                        // This message should make it clear that this field is conditionally required
                        `Based on other values in this row, a value is required for ${key}`,
                        { col: rule.columnName, severity: 'err' },
                    ));
                }
            }

            // if there's something in the field, make sure it meets requirements
        } else {
            // how do we format the value before checking it?
            let value = record[key];
            let formatFailures = 0;
            for (const formatter of rule.validationFormatters) {
                try {
                    value = formatter(value);
                } catch (e) {
                    formatFailures += 1;
                }
            }
            if (formatFailures) {
                errors.push(new ValidationError(
                    `Failed to apply ${formatFailures} formatters while validating value`,
                    { col: rule.columnName, severity: 'warn' },
                ));
            }

            // make sure pick value is one of pick list values
            if (rule.listVals.length > 0) {
                // enforce validation in lower case
                const lcItems = rule.listVals.map((val) => val.toLowerCase());

                // for pick lists, the value must be one of possible values
                if (rule.dataType === 'Pick List' && !lcItems.includes(value)) {
                    errors.push(new ValidationError(
                        `Value for ${key} ('${value}') must be one of ${lcItems.length} options in the input template`,
                        { col: rule.columnName, severity: 'err' },
                    ));
                }

                // for multi select, all the values must be in the list of possible values
                if (rule.dataType === 'Multi-Select') {
                    const entries = value.split(';').map((val) => val.trim());
                    for (const entry of entries) {
                        if (!lcItems.includes(entry)) {
                            errors.push(new ValidationError(
                                `Entry '${entry}' of ${key} is not one of ${lcItems.length} valid options`,
                                { col: rule.columnName, severity: 'err' },
                            ));
                        }
                    }
                }
            }

            if (rule.dataType === 'Currency') {
                if (value && typeof value === 'string' && !value.match(CURRENCY_REGEX_PATTERN)) {
                    errors.push(new ValidationError(
                        `Data entered in cell is "${value}", but it must be a number with at most 2 decimals`,
                        { severity: 'err', col: rule.columnName },
                    ));
                }
            }

            if (rule.dataType === 'String') {
                const patternError = validateFieldPattern(key, value);
                if (patternError) {
                    errors.push(
                        new ValidationError(patternError.message,
                            { severity: 'err', col: rule.columnName }),
                    );
                }
            }

            if (rule.dataType === 'Numeric') {
                if (typeof (value) === 'string' && Number.isNaN(parseFloat(value))) {
                // If this value is a string that can't be interpretted as a number, then error.
                // Note: This value might not be exactly what was entered in the workbook. The val
                // has already been fed through formatters that may have changed the value.
                    errors.push(
                        new ValidationError(`Expected a number, but the value was '${value}'`,
                            { severity: 'err', col: rule.columnName }),
                    );
                }
            }

            // make sure max length is not too long
            if (rule.maxLength) {
                if (rule.dataType === 'String' && String(record[key]).length > rule.maxLength) {
                    errors.push(new ValidationError(
                        `Value for ${key} cannot be longer than ${rule.maxLength} (currently, ${String(record[key]).length})`,
                        { col: rule.columnName, severity: 'err' },
                    ));
                }

                // TODO: should we validate max length on currency? or numeric fields?
            }
        }
    }

    // return all the found errors
    return errors;
}

async function validateRules({
    upload, records, rules, trns,
}) {
    const errors = [];

    // go through every rule type we have
    for (const [type, typeRules] of Object.entries(rules)) {
    // find records of the given rule type
        const tRecords = records.filter((rec) => rec.type === type).map((r) => r.content);

        // for each of those records, generate a list of rule violations
        for (const [recordIdx, record] of tRecords.entries()) {
            let recordErrors;
            try {
                // TODO: Consider refactoring this to take better advantage of async parallelization
                // eslint-disable-next-line no-await-in-loop
                recordErrors = await validateRecord({ upload, record, typeRules });
            } catch (e) {
                recordErrors = [(
                    new ValidationError(`unexpected error validating record: ${e.message}`)
                )];
            }

            // special sub-recipient validation
            try {
                if (type === 'subrecipient') {
                    recordErrors = [
                        ...recordErrors,
                        // TODO: Consider refactoring this to take better advantage of async parallelization
                        // eslint-disable-next-line no-await-in-loop
                        ...(await validateSubrecipientRecord({
                            upload, record, typeRules, recordErrors, trns,
                        })),
                    ];
                }
            } catch (e) {
                recordErrors = [
                    ...recordErrors,
                    new ValidationError(`unexpectedError validating subrecipient: ${e.message}`),
                ];
            }

            // each rule violation gets assigned a row in a sheet; they already set their column
            recordErrors.forEach((error) => {
                error.tab = type;
                error.row = 13 + recordIdx; // TODO: how do we know the data starts at row 13?

                // save each rule violation in the overall list
                errors.push(error);
            });
        }
    }

    return errors;
}

// Subrecipients can use either the uei, or the tin, or both as their identifier.
// This helper takes those 2 nullable fields and converts it to a reliable format
// so we can index and search by them.
function subrecipientIdString(uei, tin) {
    if (!uei && !tin) {
        return '';
    }
    return JSON.stringify({ uei, tin });
}

function sortRecords(records, errors) {
    // These 3 types need to search-able by their unique id so we can quickly verify they exist
    const projects = {};
    const subrecipients = {};
    const awardsGT50k = {};

    const awards = [];
    const expendituresGT50k = [];
    for (const record of records) {
        switch (record.type) {
            case 'ec1':
            case 'ec2':
            case 'ec3':
            case 'ec4':
            case 'ec5':
            case 'ec7': {
                const projectID = record.content.Project_Identification_Number__c;
                if (projectID in projects) {
                    errors.push(betaValidationWarning(
                        `Project ids must be unique, but another row used the id ${projectID}`,
                    ));
                }
                projects[projectID] = record.content;
                break;
            }
            case 'subrecipient': {
                const subRecipId = subrecipientIdString(
                    record.content.Unique_Entity_Identifier__c,
                    record.content.EIN__c,
                );
                if (subRecipId && subRecipId in subrecipients) {
                    errors.push(betaValidationWarning(
                        `Subrecipient ids must be unique, but another row used the id ${subRecipId}`,
                    ));
                }
                subrecipients[subRecipId] = record.content;
                break;
            }
            case 'awards50k': {
                const awardNumber = record.content.Award_No__c;
                if (awardNumber && awardNumber in awardsGT50k) {
                    errors.push(betaValidationWarning(
                        `Award numbers must be unique, but another row used the number ${awardNumber}`,
                    ));
                }
                awardsGT50k[awardNumber] = record.content;
                break;
            }
            case 'awards':
                awards.push(record.content);
                break;
            case 'expenditures50k':
                expendituresGT50k.push(record.content);
                break;
            case 'certification':
            case 'cover':
            case 'logic':
                // Skip these sheets, they don't include records
                // eslint-disable-next-line no-continue
                continue;
            default:
                console.error(`Unexpected record type: ${record.type}`);
        }
    }

    return {
        projects,
        subrecipients,
        awardsGT50k,
        awards,
        expendituresGT50k,
    };
}

function validateSubawardRefs(awardsGT50k, projects, subrecipients, errors) {
    // Any subawards must reference valid projects and subrecipients.
    // Track the subrecipient ids that were referenced, since we'll need them later
    const usedSubrecipients = new Set();
    for (const [awardNumber, subaward] of Object.entries(awardsGT50k)) {
        const projectRef = subaward.Project_Identification_Number__c;
        if (!(projectRef in projects)) {
            errors.push(betaValidationWarning(
                `Subaward number ${awardNumber} referenced a non-existent projectId ${projectRef}`,
            ));
        }
        const subRecipRef = subrecipientIdString(
            subaward.Recipient_UEI__c,
            subaward.Recipient_EIN__c,
        );
        if (!(subRecipRef in subrecipients)) {
            errors.push(betaValidationWarning(
                `Subaward number ${awardNumber} referenced a non-existent subrecipient with id ${subRecipRef}`,
            ));
        }
        usedSubrecipients.add(subRecipRef);
    }
    // Return this so that it can be used in the subrecipient validations
    return usedSubrecipients;
}

function validateSubrecipientRefs(subrecipients, usedSubrecipients, errors) {
    // Make sure that every subrecip included in this upload was referenced by at least one subaward
    for (const subRecipId of Object.keys(subrecipients)) {
        if (!(subRecipId && usedSubrecipients.has(subRecipId))) {
            errors.push(betaValidationWarning(
                `Subrecipient with id ${subRecipId} has no related subawards and can be ommitted.`,
            ));
        }
    }
}

function validateExpenditureRefs(expendituresGT50k, awardsGT50k, errors) {
    // Make sure each expenditure references a valid subward
    for (const expenditure of expendituresGT50k) {
        const awardRef = expenditure.Sub_Award_Lookup__c;
        if (!(awardRef in awardsGT50k)) {
            errors.push(betaValidationWarning(
                `An expenditure referenced an unknown award number ${awardRef}`,
            ));
        }
    }
}

async function validateReferences({ records }) {
    const errors = [];

    const sortedRecords = sortRecords(records, errors);

    // Must include at least 1 project in the upload
    if (Object.keys(sortedRecords.projects).length === 0) {
        errors.push(
            new ValidationError(
                `Upload doesn't include any project records`,
                { severity: 'err' },
            ),
        );
    }

    const usedSubrecipients = validateSubawardRefs(
        sortedRecords.awardsGT50k,
        sortedRecords.projects,
        sortedRecords.subrecipients,
        errors,
    );
    validateSubrecipientRefs(sortedRecords.subrecipients, usedSubrecipients, errors);
    validateExpenditureRefs(sortedRecords.expendituresGT50k, sortedRecords.awardsGT50k, errors);

    return errors;
}

async function validateUpload(upload, user, trns = null) {
    // holder for our validation errors
    const errors = [];

    // holder for post-validation functions

    // grab the records
    const records = await recordsForUpload(upload);

    // grab the rules
    const rules = await getRules();

    // list of all of our validations
    const validations = [
        validateVersion,
        validateAgencyId,
        validateEcCode,
        validateReportingPeriod,
        validateRules,
        validateReferences,
    ];

    // we should do this in a transaction, unless someone is doing it for us
    const ourTransaction = !trns;
    if (ourTransaction) {
        trns = await knex.transaction();
    }

    // run validations, one by one
    for (const validation of validations) {
        try {
            // TODO: Consider refactoring this to take better advantage of async parallelization
            // eslint-disable-next-line no-await-in-loop
            errors.push(await validation({
                upload, records, rules, trns,
            }));
        } catch (e) {
            errors.push(new ValidationError(`validation ${validation.name} failed: ${e}`));
        }
    }

    // flat list without any nulls, including errors and warnings
    const flatErrors = errors.flat().filter((x) => x);

    // tab should be sheet name, not sheet type
    for (const error of flatErrors) {
        error.tab = TYPE_TO_SHEET_NAME[error.tab] || error.tab;
    }

    // fatal errors determine if the upload fails validation
    const fatal = flatErrors.filter((x) => x.severity === 'err');
    const validated = fatal.length === 0;

    // if we successfully validated for the first time, let's mark it!
    if (validated && !upload.validated_at) {
        try {
            await markValidated(upload.id, user.id, trns);
        } catch (e) {
            errors.push(new ValidationError(`failed to mark upload: ${e.message}`));
        }
    }

    // depending on whether we validated or not, lets commit/rollback. we MUST do
    // this or bad things happen. this is why there are try/catch blocks around
    // every other function call above here
    if (ourTransaction) {
        const finishTrns = validated ? trns.commit : trns.rollback;
        await finishTrns();
        trns = knex;
    }

    // if it was valid before but is no longer valid, clear it; this happens outside the transaction
    if (!validated && upload.validated_at) {
        await markNotValidated(upload.id, trns);
    }

    // finally, return our errors
    return flatErrors;
}

module.exports = {
    validateUpload,
};

// NOTE: This file was copied from src/server/services/validate-upload.js (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z
