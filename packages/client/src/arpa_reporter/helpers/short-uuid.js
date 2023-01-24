/**
 * Shorten a UUID to make it a little less intimidating when presented in a UI.
 * @param {string} uuid The UUID to shorten.
 */
export function shortUuid(uuid) {
  return uuid.split('-')[0];
}

// NOTE: This file was copied from src/helpers/short-uuid.js (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z
