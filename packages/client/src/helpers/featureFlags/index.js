import { getFeatureFlags } from './utils';

/**
 * @returns { boolean } true if the new grants table should be active, else false.
 */

export function myProfileEnabled() {
  return getFeatureFlags().myProfileEnabled === true;
}

export function newTerminologyEnabled() {
  return getFeatureFlags().newTerminologyEnabled === true;
}
