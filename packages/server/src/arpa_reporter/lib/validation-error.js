
/**
 * severity: "err" | "warn"
 */
class ValidationError extends Error {
  constructor (message, { severity = 'err', tab = null, row = null, col = null } = {}) {
    super(message)
    this.severity = severity
    this.tab = tab
    this.row = row
    this.col = col
  }

  toObject () {
    return {
      message: this.message,
      severity: this.severity,
      tab: this.tab,
      row: this.row,
      col: this.col
    }
  }
}

module.exports = ValidationError

// NOTE: This file was copied from src/server/lib/validation-error.js (git @ 26f71a0d6d) in the arpa-reporter repo on 2022-09-12T21:06:59.476Z
