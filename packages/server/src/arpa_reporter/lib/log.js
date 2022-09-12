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

// NOTE: This file was copied from src/server/lib/log.js (git @ 26f71a0d6d) in the arpa-reporter repo on 2022-09-12T21:06:59.476Z
