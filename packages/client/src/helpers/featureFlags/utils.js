/**
 * Retrieves the object defined at `window.APP_CONFIG.featureFlags` if it exists.
 * Otherwise, an empty object will be provided.
 *
 * This function should be used when determining the active value for any feature flag,
 * in addition to any `VUE_APP_*` environment variable-based lookups.
 *
 * @example
 * // Returns true or false
 * function useFoo() {
 *  return getFeatureFlags().useFoo === true;
 * }
 *
 * @returns { object } Object keyed by runtime feature flags, which may be empty.
 */
export function getFeatureFlags() {
  const appConfig = window.APP_CONFIG || {};
  const featureFlags = appConfig.featureFlags || {};
  return featureFlags;
}
