
function requiredArgument (value, message = 'required argument missing!') {
  if (value === undefined) {
    throw new Error(message)
  }
}

module.exports = { requiredArgument }

// NOTE: This file was copied from src/server/lib/preconditions.js (git @ 98c1aa2586) in the arpa-reporter repo on 2022-09-02T05:09:55.179Z
