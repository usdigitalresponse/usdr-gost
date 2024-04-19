import _ from 'lodash';
import numeral from 'numeral';

const EMAIL_RE = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/ // https://stackoverflow.com/a/46181

export function isValidEmail(value) {
  return String(value).match(EMAIL_RE)
}

export function titleize(s) {
  if (!s) {
    return s;
  }
  const words = s
    .split(/[_\s]+/)
    .map((w) => w.slice(0, 1).toUpperCase() + w.slice(1));
  return words.join(' ');
}

export function singular(s) {
  return s ? s.replace(/s$/, '') : '';
}

export function columnTitle(column) {
  return column.label ? column.label : titleize(column.name);
}

function makeValidationMessage(column, defaultMessage) {
  if (column.validationMessage) {
    return `${columnTitle(column)} ${column.validationMessage}`;
  }
  return `${columnTitle(column)} ${defaultMessage}`;
}

export function validate(columns, record) {
  const validationMessages = [];
  const result = {};
  columns.forEach((column) => {
    let value = record[column.name];
    if (column.required && _.isEmpty(value) && !_.isNumber(value)) {
      validationMessages.push(makeValidationMessage(column, 'is required'));
    }
    if (!_.isEmpty(value)) {
      if (column.minimumLength && value.length < column.minimumLength) {
        validationMessages.push(
          makeValidationMessage(
            column,
            `must be at least ${column.minimumLength} characters long`,
          ),
        );
      }
      if (column.maximumLength && value.length > column.maximumLength) {
        validationMessages.push(
          makeValidationMessage(
            column,
            `must be no more than ${column.maximumLength} characters long`,
          ),
        );
      }
      if (column.pattern) {
        const re = new RegExp(column.pattern);
        if (!value.match(re)) {
          validationMessages.push(
            makeValidationMessage(
              column,
              `does not match the pattern "${column.pattern}"`,
            ),
          );
        }
      }
      if (column.numeric) {
        if (numeral(value).value() === null) {
          validationMessages.push(
            makeValidationMessage(column, 'must be numeric'),
          );
        }
      }
      if (column.json) {
        try {
          value = JSON.parse(value);
        } catch (e) {
          validationMessages.push(makeValidationMessage(column, e.message));
        }
      }
    }
    result[column.name] = value;
  });
  return { validatedRecord: result, messages: _.uniq(validationMessages) };
}
