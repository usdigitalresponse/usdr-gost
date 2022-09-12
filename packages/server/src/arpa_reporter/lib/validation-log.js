const _ = require('lodash')

class ValidationItem {
  constructor ({ message, severity = 1, tab = null, row = null, col = null }) {
    this.info = { message, severity, tab, row, col }
  }
}

class ValidationLog {
  constructor () {
    this.log = []
  }

  append (toAppend) {
    if (toAppend) {
      if (_.isString(toAppend)) {
        this.log.push(new ValidationItem({ message: toAppend }))
      } else if (_.isArrayLike(toAppend)) {
        // assuming this is a list of validationItems
        this.log.push(...toAppend)
      } else if (toAppend instanceof ValidationLog) {
        this.log.push(...toAppend.log)
      } else {
        // assuming this is a single validationItem
        this.log.push(toAppend)
      }
    }
    return this
  }

  getLog () {
    return this.log.map(item => item.info)
  }

  success () {
    return this.log.length === 0
  }
}

module.exports = { ValidationLog, ValidationItem }

// NOTE: This file was copied from src/server/lib/validation-log.js (git @ 26f71a0d6d) in the arpa-reporter repo on 2022-09-12T21:06:59.476Z
