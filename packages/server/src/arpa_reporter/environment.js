/**
 * Environment variables. Please keep declaration in this file in sync with:
 * /render.yaml
 */
require('dotenv').config()

const { join, resolve } = require('path')

const VERBOSE = Boolean(process.env.VERBOSE)

const POSTGRES_URL = process.env.POSTGRES_URL

const DATA_DIR = resolve(process.env.DATA_DIR)
const UPLOAD_DIR = join(DATA_DIR, 'uploads')
const PERIOD_TEMPLATES_DIR = join(UPLOAD_DIR, 'period_templates')

// Note: in legacy standalone ARPA Report repo, this points to src/server; in GOST
// it points to packages/server/src/arpa_reporter
const SERVER_CODE_DIR = __dirname
const SERVER_DATA_DIR = join(SERVER_CODE_DIR, 'data')

const EMPTY_TEMPLATE_NAME = 'ARPA SFRF Reporting Workbook v20220705.xlsm'

const COOKIE_SECRET = process.env.COOKIE_SECRET

const NODE_ENV = process.env.NODE_ENV
const IS_DEV = NODE_ENV === 'development'

const LOGIN_EXPIRY_MINUTES = parseInt(process.env.LOGIN_EXPIRY_MINUTES) || 30

const PORT = parseInt(process.env.PORT) || 3000
const WEBSITE_DOMAIN = process.env.WEBSITE_DOMAIN

const NOTIFICATIONS_EMAIL = process.env.NOTIFICATIONS_EMAIL
const NOTIFICATIONS_EMAIL_PW = process.env.NOTIFICATIONS_EMAIL_PW
const NODEMAILER_HOST = process.env.NODEMAILER_HOST
const NODEMAILER_PORT = process.env.NODEMAILER_PORT

const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY
const SES_REGION = process.env.SES_REGION

module.exports = {
  DATA_DIR,
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
  NOTIFICATIONS_EMAIL,
  NOTIFICATIONS_EMAIL_PW,
  NODEMAILER_HOST,
  NODEMAILER_PORT,
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  SES_REGION
}

// NOTE: This file was copied from src/server/environment.js (git @ 26f71a0d6d) in the arpa-reporter repo on 2022-09-12T21:06:59.476Z
