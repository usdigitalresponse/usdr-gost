/**
 * @module
 *
 * Formatting helpers for spreadsheet output.  Note that these helpers are
 * designed to NOT apply any validation of their own.  Output generation should
 * reliably succeed if uploads have all passed validation.
 */
const round = require('lodash/round')
const { ecCodes } = require('./arpa-ec-codes')

const EXPENDITURE_CATEGORIES = {
  ec1: '1-Public Health',
  ec2: '2-Negative Economic Impacts',
  ec3: '3-Public Health-Negative Economic Impact: Public Sector Capacity',
  ec4: '4-Premium Pay',
  ec5: '5-Infrastructure',
  ec7: '7-Administrative'
}

/**
 * Normalize casing of single word values.
 * This is especially useful for "Yes"/"No" responses.
 *
 * @param {string} value
 * @returns {string}
 */
function capitalizeFirstLetter (value) {
  if (typeof value !== 'string' || value === '') return value
  return `${value[0].toUpperCase()}${value.slice(1).toLowerCase()}`
}

function currency (value) {
  if (typeof value !== 'number') return value
  return round(value, 2).toString()
}

function ec (value) {
  return EXPENDITURE_CATEGORIES[value]
}

/**
 * Normalize delimeters in a multiselect value.
 *
 * @param {string} value
 * @returns {string} normalized value
 */
function multiselect (value) {
  if (typeof value !== 'string') return value
  return value
    .trim()
    .replace(/^-/, '') // remove preceding hyphen
    .replace(/,/g, '') // remove all commas
    .split(/;[- ]*/) // match any delimiter format
    .filter(value => value !== '') // remove empty values (e.g. trailing or double delimiter)
    .join(';')
}

/**
 * Transform a subcategory code to its canonical name.
 *
 * @param {string} value
 * The expecditure subcategory code as supplied in the input sheet
 */
function subcategory (value) {
  if (value == null) return value
  if (!ecCodes[value]) return undefined
  return `${value}-${ecCodes[value]}`
}

function tin (value) {
  if (value == null) return value
  return value.toString().replace('-', '')
}

function zip (value) {
  if (value == null) return value
  return value.toString().padStart(5, '0')
}

function zip4 (value) {
  if (value == null) return value
  return value.toString().padStart(4, '0')
}

module.exports = {
  capitalizeFirstLetter,
  currency,
  ec,
  multiselect,
  subcategory,
  tin,
  zip,
  zip4
}

// NOTE: This file was copied from src/server/lib/format.js (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z
