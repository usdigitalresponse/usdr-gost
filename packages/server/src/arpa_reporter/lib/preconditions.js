
function requiredArgument (value, message = 'required argument missing!') {
  if (value === undefined) {
    throw new Error(message)
  }
}

module.exports = { requiredArgument }

// NOTE: This file was copied from src/server/lib/preconditions.js (git @ d124c44d0e) in the arpa-reporter repo on 2022-09-08T23:48:24.330Z
