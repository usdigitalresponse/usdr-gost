function requiredArgument(value, message = 'required argument missing!') {
    if (value === undefined) {
        throw new Error(message);
    }
}

module.exports = { requiredArgument };

// NOTE: This file was copied from src/server/lib/preconditions.js (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z
