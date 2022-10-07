#!/usr/bin/env node

import { readFileSync } from 'fs';
import { readdir, writeFile } from 'fs/promises';
import path from 'path';

import 'dotenv/config';
import XLSX from 'xlsx';

// eslint-disable-next-line import/extensions
import { SERVER_DATA_DIR, SERVER_CODE_DIR } from '../arpa_reporter/environment.js';

function parseECCodes(ecHelpText) {
    // Return any matches of a single-digit, followed by a '.', followed by 1 or 2 more digits
    const pattern = /\d\.\d{1,2}/g;
    return ecHelpText.match(pattern);
}

function parseTemplateName(cellText) {
    // some of the templates include a redundant header in this cell
    return cellText.replace('Template Name: ', '');
}

function parseVersion(cellText) {
    // some of the templates include a redundant header in this cell
    return cellText.replace('Version: ', '');
}

function colName(num) {
    // given a column number, return the alphabetic name of that col
    // 0 -> A, 1 -> B, ...,  25 -> Z, 26 -> AA, ...
    let alpha = '';
    for (; num >= 0; num = parseInt(num / 26, 10) - 1) {
        alpha = String.fromCharCode((num % 26) + 0x41) + alpha;
    }
    return alpha;
}

function parseFields(sheet) {
    // Field ids are found in row 4, but are saved in the sheet object by cellname.
    // Loop from index 1, incrementing and converting it to cell name, and read the
    // field id until we find an empty cell
    let colNum = 1;
    const result = [];
    for (;;) {
        const colAlpha = colName(colNum);
        const fieldCell = sheet[`${colAlpha}4`];
        if (!fieldCell) {
            return result;
        }
        result.push({
            fieldId: fieldCell.v,
            fieldName: (sheet[`${colAlpha}6`]) ? sheet[`${colAlpha}6`].v : '',
            required: sheet[`${colAlpha}5`].v,
        });
        colNum += 1;
    }
}

const run = async () => {
    const templateDir = path.join(
        SERVER_DATA_DIR,
        'treasury',
    );
    const filelist = await readdir(templateDir);
    const outputTemplateData = {};
    filelist.forEach((filename) => {
        if (!filename.includes('.xlsx')) {
            // Don't include non-excel files, like .DS_Store
            return;
        }

        // Project files have important data to parse, like EC codes
        const buffer =  readFileSync(path.join(templateDir, filename));
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        if (Object.keys(workbook.Sheets).length !== 1) {
            console.log(`Unexpected multiple sheets in file ${filename}`);
        }
        const sheetName = Object.keys(workbook.Sheets)[0];
        const sheet = workbook.Sheets[sheetName];
        const version = parseVersion(sheet.A1.v);
        outputTemplateData[filename] = {
            version,
            templateName: parseTemplateName(sheet.A2.v),
            fields: parseFields(sheet),
        };
        if (filename.includes('project')) {
            // Project files have additional data about EC codes that should be parsed
            outputTemplateData[filename].ecCodes = parseECCodes(sheet.C7.v);
        }
    });
    const destPath = path.join(SERVER_CODE_DIR, 'lib', 'outputTemplates.json');
    const strData = JSON.stringify(outputTemplateData, null, 2);
    writeFile(destPath, strData);

    // TODO: Use this structured data and compare it to the rules parsed from the workbook to see if we are
    // missing any required questions or asking any unnecessary ones
};

run();
