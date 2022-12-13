
const srcRules = require('../lib/templateRules.json')
const _ = require('lodash');

const recordValueFormatters = {
  makeString: (val) => String(val),
  trimWhitespace: (val) => _.isString(val) ? val.trim() : val,
  removeCommas: (val) => _.isString(val) ? val.replace(/,/g, '') : val,
  removeSepDashes: (val) => _.isString(val) ? val.replace(/^-/, '').replace(/;\s*-/g, ';'): val,
  toLowerCase: (val) => _.isString(val) ? val.toLowerCase() : val
}

/*
Structured data recording all the immediate corrections we want to apply to dropdowns.
There are 2 types of corrections we can apply:
1) The value in the currently committed input template is incorrect.
2) A value in the dropdown list changed in the past, and we want to continue to allow legacy vals as valid inputs.
In the first case, we will alter the validation rule to check against the new correct value, and
then treat the value currently seen in the worksheet as an allowable legacy value.
In both cases, we will foribly coerce any instances of legacy values into the correct value.
This coercion happens whenever we read the value from the upload file, so it will apply to
validations we perform, as well as values we export in reports.
   */
const dropdownCorrections = {
  'Affordable housing supportive housing or recovery housing': {
    correctedValue: 'Affordable housing, supportive housing, or recovery housing'
  },
  'Childcare, daycare, and early learning facilities': {
    correctedValue: 'Childcare, daycare and early learning facilities'
  },
  'COVID-19 testing sites and laboratories': {
    allowableLegacyValues: [
      'COVID-19 testing sites and laboratories, and acquisition of related equipment',
      'COVID-19 testing sites and laboratories and acquisition of related equipment'
    ]
  },
  'Mitigation measures in small businesses, nonprofits, and impacted industries': {
    correctedValue: 'Mitigation measures in small businesses, nonprofits and impacted industries'
  },
  'Family or child care': {
    allowableLegacyValues: ['Family or childcare']
  }
}

function generateRules () {
  const rules = srcRules

  // subrecipient EIN is actually a length-10 string
  rules.subrecipient.EIN__c.dataType = 'String'
  rules.subrecipient.EIN__c.maxLength = 10

  rules.awards50k.Recipient_EIN__c.dataType = 'String'
  rules.awards50k.Recipient_EIN__c.maxLength = 10

  // value formatters modify the value in the record before it's validated
  // we check any rule against the formatted value
  // for any values we format, we should format them the same way when we export
  for (const ruleType of Object.keys(rules)) {
    for (const rule of Object.values(rules[ruleType])) {
      // validationFormatters are only applied when validating the records, so they
      // aren't used during exports.
      // persistentFormatters are always applied as soon as a value is read from a
      // an upload, so they will affect both validation AND the exported value.
      rule.validationFormatters = []
      rule.persistentFormatters = []

      if (rule.dataType === 'String') {
        rule.validationFormatters.push(recordValueFormatters.makeString)
        rule.persistentFormatters.push(recordValueFormatters.trimWhitespace)
      }

      if (rule.dataType === 'Multi-Select') {
        rule.validationFormatters.push(recordValueFormatters.removeCommas)
        rule.validationFormatters.push(recordValueFormatters.removeSepDashes)
      }

      if (rule.listVals.length > 0) {
        rule.validationFormatters.push(recordValueFormatters.toLowerCase)

        for (let i = 0; i < rule.listVals.length; i++) {
          const worksheetValue = rule.listVals[i]
          const correction = dropdownCorrections[worksheetValue]
          if (correction) {
            const correctValue = correction.correctedValue || worksheetValue
            const valuesToCoerce = (correction.allowableLegacyValues || []).concat(worksheetValue)

            rule.listVals[i] = correctValue
            rule.persistentFormatters.push(val => valuesToCoerce.includes(val) ? correctValue : val)
          }
        }
      }
    }
  }

  return rules
}

let generatedRules

function getRules () {
  if (!generatedRules) generatedRules = generateRules()

  return generatedRules
}

module.exports = {
  getRules,
  dropdownCorrections
}

// NOTE: This file was copied from src/server/services/validation-rules.js (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z
