const { VERBOSE } = require('../environment')

/**
 * An alias for console.dir.
 *
 * This function is a no-op if environment.VERBOSE is not set.
 *
 * @param {...*} messages
 */
let dir = (...messages) => {}
if (VERBOSE) {
  dir = console.dir
}

/**
 * An alias for console.log.
 *
 * This function is a no-op if environment.VERBOSE is not set.
 *
 * @param {...*} messages
 */
let log = (...messages) => {}
if (VERBOSE) {
  log = console.log
}

module.exports = {
  dir,
  log
}

// NOTE: This file was copied from src/server/lib/log.js (git @ 98c1aa2586) in the arpa-reporter repo on 2022-09-02T05:09:55.179Z
