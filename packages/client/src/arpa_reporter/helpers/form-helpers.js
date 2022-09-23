import _ from 'lodash'
import numeral from 'numeral'
import moment from 'moment'

export function titleize (s) {
  if (!s) {
    return s
  }
  const words = s
    .split(/[_\s]+/)
    .map(w => w.slice(0, 1).toUpperCase() + w.slice(1))
  return words.join(' ')
}

export function singular (s) {
  return s ? s.replace(/s$/, '') : ''
}

export function columnTitle (column) {
  return column.label ? column.label : titleize(column.name)
}

function makeValidationMessage (column, defaultMessage) {
  if (column.validationMessage) {
    return `${columnTitle(column)} ${column.validationMessage}`
  }
  return `${columnTitle(column)} ${defaultMessage}`
}

export function validate (columns, record) {
  const validationMessages = []
  const result = {}
  columns.forEach(column => {
    let value = record[column.name]
    if (column.required && _.isEmpty(value) && !_.isNumber(value)) {
      validationMessages.push(makeValidationMessage(column, 'is required'))
    }
    if (!_.isEmpty(value)) {
      if (column.minimumLength && value.length < column.minimumLength) {
        validationMessages.push(
          makeValidationMessage(
            column,
            `must be at least ${column.minimumLength} characters long`
          )
        )
      }
      if (column.maximumLength && value.length > column.maximumLength) {
        validationMessages.push(
          makeValidationMessage(
            column,
            `must be no more than ${column.maximumLength} characters long`
          )
        )
      }
      if (column.pattern) {
        const re = new RegExp(column.pattern)
        if (!value.match(re)) {
          validationMessages.push(
            makeValidationMessage(
              column,
              `does not match the pattern "${column.pattern}"`
            )
          )
        }
      }
      if (column.numeric) {
        if (numeral(value).value() === null) {
          validationMessages.push(
            makeValidationMessage(column, 'must be numeric')
          )
        }
      }
      if (column.json) {
        try {
          value = JSON.parse(value)
        } catch (e) {
          validationMessages.push(makeValidationMessage(column, e.message))
        }
      }
      if (value && column.date) {
        const d = moment(value)
        if (!d.isValid()) {
          validationMessages.push(
            makeValidationMessage(column, 'must be a valid date')
          )
        }
      }
    }
    result[column.name] = value
  })
  return { validatedRecord: result, messages: _.uniq(validationMessages) }
}

// NOTE: This file was copied from src/helpers/form-helpers.js (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z
