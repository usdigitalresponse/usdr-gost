#!/usr/bin/env node
/* eslint-disable import/extensions */

import { readFile, writeFile } from 'fs/promises';
import path from 'path';

import 'dotenv/config';

// This is a dev-only script, so we can make an exception for the import
// eslint-disable-next-line import/no-extraneous-dependencies
import chalk from 'chalk';
import XLSX from 'xlsx';
import lodash from 'lodash';

import { CPF_DATA_SHEET_TYPES, DATA_SHEET_TYPES, readVersionRecord } from '../arpa_reporter/services/records.js';
import { SERVER_DATA_DIR, EMPTY_TEMPLATE_NAME, SERVER_CODE_DIR } from '../arpa_reporter/environment.js';
import { dropdownCorrections } from '../arpa_reporter/services/validation-rules.js';

const { merge } = lodash;
const log = (msg) => { console.log(chalk.green(msg)); };

// For every dropdown extracted into templateDropdowns.json, record what fields
// should be validated according to that list
const dropdownNamesToFieldIds = {
    'Ownership': [
        'Capital_Asset_Ownership_Type__c',
    ],
    'Status': [
        'Project_Status__c',
    ],
    'YesNo': [
        'Access_to_Public_Transit__c',
        'Measurement_of_Effectiveness__c',
        'Same_Address__c',
        'Affordable_Connectivity_Program_ACP__c',
        'Community_Benefit_Agreement__c',
        'Prioritize_Local_Hires__c',
        'Project_Labor_Agreement__c',
        'Adequate_Wages__c',
        'Project_Labor_Certification__c',
        'Any_Wages_Less_Than_Prevailing__c',
        'Davis_Bacon_Certification__c',
        'Matching_Funds__c',
        'Other_Federal_Funding__c',
        'Operations_intiated__c',
    ],
    'TechType': [
        'Technology_Type_Actual__c',
        'Technology_Type_Planned__c',

    ],
    'State': [ 'State_Planned__c', 'State_Actual__c', 'State_Abbreviated__c' ],
    'Investment': [
        'Type_of_Investment__c',
    ],
};

function invertDropdownToFieldMap() {
    const inverted = [];
    Object.keys(dropdownNamesToFieldIds).forEach((dropDownName) => {
        dropdownNamesToFieldIds[dropDownName].forEach((fieldId) => {
            inverted[fieldId] = dropDownName;
        });
    });
    return inverted;
}

// Allow lookup from field id
const fieldIdToDropdownName = invertDropdownToFieldMap();

function makeColNames() {
    const upcaseLetters = [];
    for (let i = 65; i <= 90; i += 1) {
        upcaseLetters.push(String.fromCharCode(i));
    }

    const secondSet = upcaseLetters.map((letter) => `A${letter}`);
    const thirdSet = upcaseLetters.map((letter) => `B${letter}`);
    return [...upcaseLetters, ...secondSet, ...thirdSet];
}

const COLNAMES = makeColNames();

function parseRequired(rqStr) {
    if (rqStr === 'Required') return true;
    if (rqStr === 'Optional') return false;
    return rqStr;
}

// for the given type and column, return all the EC codes where that column is shown/used
function filterEcCodes(logic, type, columnName) {
    const rulesForType = logic.filter((rule) => rule.type === type);
    if (rulesForType.length === 0) return false;

    const ecCodes = [];
    for (const rule of rulesForType) {
        if (rule.columnNames[columnName]) {
            ecCodes.push(rule.ecCode);
        }
    }

    return ecCodes;
}

async function extractRules(workbook, logic, dropdowns) {
    const rules = {};

    // add logic rule; this also illustrates what rules look like
    const { version } = readVersionRecord(workbook);
    rules.logic = {
        version: {
            version, // special field; other rules don't have this
            key: 'version',
            index: 0,
            required: false,
            dataType: 'String',
            maxLength: 10,
            listVals: [],
            columnName: 'B',
            humanColName: 'Input template version',
            ecCodes: false,
        },
    };

    // read rules for ordinary sheet types
    for (const sheetName of Object.keys(CPF_DATA_SHEET_TYPES)) {
        const type = CPF_DATA_SHEET_TYPES[sheetName];
        console.log(sheetName, type);
        const sheet = workbook.Sheets[sheetName];

        // entire sheet
        const sheetRange = XLSX.utils.decode_range(sheet['!ref']);

        // range A1:13
        const headerRange = merge({}, sheetRange, {
            s: { c: 0, r: 0 },
            e: { r: 12 },
        });

        const rows = XLSX.utils.sheet_to_json(sheet, {
            header: 1,
            range: XLSX.utils.encode_range(headerRange),
        });

        const colKeys = rows[2];
        const required = rows[3].map((str) => parseRequired(str));
        // Don't use the listVals recorded in rows[5]. Use the values from the dropdowns tab instead
        const dataTypes = rows[6];
        const maxLengths = rows[7].map((ml) => Number(ml));
        const humanColNames = rows[11];

        const sheetRules = {};
        for (const [colIdx, key] of colKeys.entries()) {
            // ignore the first two columns
            // eslint-disable-next-line no-continue
            if (colIdx < 2) continue;

            // ignore if key is blank
            // eslint-disable-next-line no-continue
            if (!key) continue;

            // construct rule
            const rule = {
                key,
                index: colIdx,
                required: required[colIdx],
                dataType: dataTypes[colIdx] || 'Unknown',
                maxLength: maxLengths[colIdx] || null,
                listVals: dropdowns[fieldIdToDropdownName[key]] || [],
                columnName: COLNAMES[colIdx],
                humanColName: humanColNames[colIdx],
                ecCodes: filterEcCodes(logic, type, COLNAMES[colIdx]),
            };

            sheetRules[key] = rule;
        }

        rules[type] = sheetRules;
    }

    return rules;
}

async function extractDropdowns(workbook) {
    const sheet = workbook.Sheets.Dropdowns;

    // entire sheet
    const sheetRange = XLSX.utils.decode_range(sheet['!ref']);

    // range B2:
    const headerRange = merge({}, sheetRange, {
        s: { c: 1, r: 1 },
    });

    const rows = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
        range: XLSX.utils.encode_range(headerRange),
    });

    const dropdowns = {};
    console.log(rows);

    rows[0].map((n) => n.trim()).forEach((colName, colIdx) => {
        console.log(colName, colIdx);
        console.log(dropdowns);
        dropdowns[colName] = [];
        let rowIdx = 1;
        while (rows[rowIdx] && rows[rowIdx][colIdx]) {
            if (colName === 'State') console.log(rows[rowIdx][colIdx], rowIdx, colIdx);
            dropdowns[colName].push(rows[rowIdx][colIdx]);
            rowIdx += 1;
        }
    });

    return dropdowns;
}

async function extractLogic(workbook) {
    const sheet = workbook.Sheets.Logic;

    // entire sheet
    const sheetRange = XLSX.utils.decode_range(sheet['!ref']);

    // range A2:
    const headerRange = merge({}, sheetRange, {
        s: { c: 0, r: 1 },
    });

    const rows = XLSX.utils.sheet_to_json(sheet, {
        range: XLSX.utils.encode_range(headerRange),
    });

    const sheetNames = Object.fromEntries(workbook.SheetNames.entries());
    console.log(sheetNames);
    const logic = rows.map((row) => {
        // parse EC code
        const codeString = row['Project Use Code'];
        const codeParts = codeString.split('-');
        const ecCode = codeParts[0];
        const ecCodeDesc = codeParts.slice(1, codeParts.length).join('-');

        // type that this logic rule applies to
        const sheetName = sheetNames[row.Sheet - 1];
        const type = CPF_DATA_SHEET_TYPES[sheetName];

        // which columns are relevant given the ec code?
        const columnNames = Object.fromEntries(
            COLNAMES.map((columnName) => [columnName, Boolean(row[columnName])]),
        );

        return {
            type,
            ecCode,
            ecCodeDesc,
            columnNames,
        };
    });

    return logic;
}

async function saveTo(destFilename, data) {
    const destPath = path.join(SERVER_CODE_DIR, 'lib', destFilename);
    const strData = JSON.stringify(data, null, 2);

    log(`writing to ${destFilename}`);
    return writeFile(destPath, strData);
}

function validateExtractedDropdowns(extractedDropdowns) {
    const extractedNames = Object.keys(extractedDropdowns);
    const mappedNames = Object.keys(dropdownNamesToFieldIds);

    const missingMappings = extractedNames.filter((x) => !mappedNames.includes(x));
    const extraMappings = mappedNames.filter((x) => !extractedNames.includes(x));

    if (missingMappings.length || extraMappings.length) {
        console.log(chalk.red(`Error: The configured dropdown mappings don't match the dropdowns extracted from the worksheet. \n\
      Missing mappings: ${missingMappings}\n\
      Extra mappings: ${extraMappings}`));
        throw new Error('Correct the dropdownNamesToFieldIds mappings to continue');
    }
}

function validateDropdownCorrections(extractedDropdowns) {
    return true;
    // Make sure that every correction configured refers to a real value in a dropdown somewhere
    Object.keys(dropdownCorrections).forEach((valToCorrect) => {
        for (const dropdownName in extractedDropdowns) {
            for (const dropdownValue of extractedDropdowns[dropdownName]) {
                if (valToCorrect === dropdownValue) {
                    return;
                }
            }
        }
        // Didn't find the value anywhere? Throw an error to force us to correct it

        // Getting this error?
        // Did you recently add a new correction or update the worksheet?
        // Check to make sure the key in dropdownCorrections exactly matches the key *currently* in
        // the worksheet.
        console.log(chalk.red(
            `Error: correction for dropdown value ${valToCorrect} doesn't reference a real value.`,
        ));
        throw new Error('Fix the dropdownCorrections configuration to continue.');
    });
}
const run = async () => {
    log(`extracting rules from ${EMPTY_TEMPLATE_NAME}...`);

    // read the workbook
    const buffer = await readFile(path.join(SERVER_DATA_DIR, EMPTY_TEMPLATE_NAME));
    const workbook = XLSX.read(buffer, { type: 'buffer' });

    const logic = await extractLogic(workbook);
    const dropdowns = await extractDropdowns(workbook);
    validateExtractedDropdowns(dropdowns);
    await saveTo('templateDropdowns.json', dropdowns);
    validateDropdownCorrections(dropdowns);

    const rules = await extractRules(workbook, logic, dropdowns);
    await saveTo('templateRules.json', rules);
};

run();

// NOTE: This file was copied from scripts/generateRules.mjs (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z
