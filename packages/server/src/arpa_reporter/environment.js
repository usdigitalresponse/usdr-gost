/**
 * Environment variables. Please keep declaration in this file in sync with:
 * /render.yaml
 */
require('dotenv').config();

const { join, resolve } = require('path');

const VERBOSE = Boolean(process.env.VERBOSE);

const { POSTGRES_URL } = process.env;

const DATA_DIR = resolve(process.env.DATA_DIR);
const UPLOAD_DIR = join(DATA_DIR, 'uploads');
// FIXME: TEMP_DIR should probbaly be a sub-path of uploads.
// see also: https://usdigitalresponse.slack.com/archives/C031R1Y49KL/p1675828761404989
// After we move to AWS, consider uncommenting the following line:
// const TEMP_DIR = join(DATA_DIR, 'tmp')
const TEMP_DIR = join(UPLOAD_DIR, 'tmp');
const PERIOD_TEMPLATES_DIR = join(UPLOAD_DIR, 'period_templates');

// Note: in legacy standalone ARPA Report repo, this points to src/server; in GOST
// it points to packages/server/src/arpa_reporter
const SERVER_CODE_DIR = __dirname;
const SERVER_DATA_DIR = join(SERVER_CODE_DIR, 'data');

const EMPTY_TEMPLATE_NAME = 'ARPA SFRF Reporting Workbook v20230305.xlsm';

const { COOKIE_SECRET } = process.env;

const { NODE_ENV } = process.env;
const IS_DEV = NODE_ENV === 'development';

const LOGIN_EXPIRY_MINUTES = Number.parseInt(process.env.LOGIN_EXPIRY_MINUTES, 10) || 30;

const PORT = Number.parseInt(process.env.PORT, 10) || 3000;
const { WEBSITE_DOMAIN } = process.env;
const ARPA_REPORTER_BASE_URL = `${WEBSITE_DOMAIN}/arpa_reporter`;

const { NOTIFICATIONS_EMAIL } = process.env;
const { NOTIFICATIONS_EMAIL_PW } = process.env;
const { NODEMAILER_HOST } = process.env;
const { NODEMAILER_PORT } = process.env;

const { AWS_ACCESS_KEY_ID } = process.env;
const { AWS_SECRET_ACCESS_KEY } = process.env;
const { SES_REGION } = process.env;

const { LOGIN_DISABLED_MESSAGE } = process.env;
const { LOGIN_WARNING_MESSAGE } = process.env;

module.exports = {
    DATA_DIR,
    TEMP_DIR,
    UPLOAD_DIR,
    PERIOD_TEMPLATES_DIR,
    SERVER_CODE_DIR,
    SERVER_DATA_DIR,
    EMPTY_TEMPLATE_NAME,
    POSTGRES_URL,
    VERBOSE,
    COOKIE_SECRET,
    NODE_ENV,
    IS_DEV,
    LOGIN_EXPIRY_MINUTES,
    PORT,
    WEBSITE_DOMAIN,
    ARPA_REPORTER_BASE_URL,
    NOTIFICATIONS_EMAIL,
    NOTIFICATIONS_EMAIL_PW,
    NODEMAILER_HOST,
    NODEMAILER_PORT,
    AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY,
    SES_REGION,
    LOGIN_DISABLED_MESSAGE,
    LOGIN_WARNING_MESSAGE,
};

// NOTE: This file was copied from src/server/environment.js (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z
