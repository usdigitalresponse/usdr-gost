
function requiredArgument (value, message = 'required argument missing!') {
  if (value === undefined) {
    throw new Error(message)
  }
}

module.exports = { requiredArgument }

// NOTE: This file was copied from src/server/lib/preconditions.js (git @ 26f71a0d6d) in the arpa-reporter repo on 2022-09-12T21:06:59.476Z
