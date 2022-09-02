
/**
 * Shorten a UUID to make it a little less intimidating when presented in a UI.
 * @param {string} uuid The UUID to shorten.
 */
export function shortUuid (uuid) {
  return uuid.split('-')[0]
}

// NOTE: This file was copied from src/helpers/short-uuid.js (git @ 98c1aa2586) in the arpa-reporter repo on 2022-09-02T05:09:55.179Z
