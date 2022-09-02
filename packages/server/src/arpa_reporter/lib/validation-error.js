
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

// NOTE: This file was copied from src/server/lib/validation-error.js (git @ 98c1aa2586) in the arpa-reporter repo on 2022-09-02T05:09:55.179Z
