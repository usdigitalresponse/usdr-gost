import { getFeatureFlags } from './utils';

/**
 * @returns { boolean } true if the useNewTable feature flag is active, else false.
 */
export function useNewGrantsTable() {
  return process.env.VUE_APP_USE_NEW_TABLE === 'true' || getFeatureFlags().useNewTable === true;
}
