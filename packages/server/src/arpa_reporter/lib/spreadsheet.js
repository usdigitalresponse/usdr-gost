/*
--------------------------------------------------------------------------------
-                                 lib/spreadsheet.js
--------------------------------------------------------------------------------

*/
/* eslint camelcase: 0 */

// cleanString() trims leading and trailing spaces.
// - If the entire string is enclosed in double quotes, removes them (does
// not remove a trailing or leading double quote without a corresponding
// one at the other end).
// - Converts double spaces to single spaces.
function cleanString (val) {
  if (!val && val !== 0) {
    return null
  }
  val = String(val).trim()
  if (val) {
    val = val.replace(/^"(.+)"$/, '$1')
      .replace(/ {2}/g, ' ')
      .trim()
  }
  return val
}

function zeroPad (code) {
  code = String(code)
  if (code.length < 3) {
    code = (`000${code}`).substr(-3)
  }
  return code
}

module.exports = {
  cleanString,
  zeroPad
}

/*                                  *  *  *                                   */

// NOTE: This file was copied from src/server/lib/spreadsheet.js (git @ d124c44d0e) in the arpa-reporter repo on 2022-09-08T23:48:24.330Z
