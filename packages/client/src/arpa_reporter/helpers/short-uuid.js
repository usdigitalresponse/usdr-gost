
/**
 * Shorten a UUID to make it a little less intimidating when presented in a UI.
 * @param {string} uuid The UUID to shorten.
 */
export function shortUuid (uuid) {
  return uuid.split('-')[0]
}

// NOTE: This file was copied from src/helpers/short-uuid.js (git @ 26f71a0d6d) in the arpa-reporter repo on 2022-09-12T21:06:59.476Z
