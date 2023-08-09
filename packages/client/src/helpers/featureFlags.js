export function useNewGrantsTable() {
  return process.env.VUE_APP_USE_NEW_TABLE === 'true' || (window.APP_CONFIG || {}).UseNewTable === true;
}
