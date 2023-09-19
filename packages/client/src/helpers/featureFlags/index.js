import { getFeatureFlags } from './utils';

/**
 * @returns { boolean } true if the new grants table should be active, else false.
 */
export function useNewGrantsTable() {
  return getFeatureFlags().useNewTable === true;
}

export function myProfileEnabled() {
  return getFeatureFlags().myProfileEnabled === true;
}
