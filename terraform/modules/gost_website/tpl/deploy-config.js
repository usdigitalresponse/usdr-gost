window.APP_CONFIG = window.APP_CONFIG || {};
window.APP_CONFIG.apiURLForGOST = 'https://${gost_api_domain}/';
window.apiURLForGOST = window.APP_CONFIG.apiURLForGOST; // Legacy

window.APP_CONFIG.DD_RUM_ENABLED = ${dd_rum_enabled};
window.APP_CONFIG.DD_RUM_CONFIG = ${dd_rum_config};

window.APP_CONFIG.GOOGLE_TAG_ID = '${google_tag_id}';

window.APP_CONFIG.featureFlags = ${feature_flags};

window.APP_CONFIG.overrideFeatureFlag = (flagName, overrideValue) => {
  const storageKey = 'featureFlags';
  let overrides = {};
  try {
    overrides = JSON.parse(window.sessionStorage.getItem(storageKey)) || {};
  } catch (e) {
    console.error(`Error parsing window.sessionStorage.$${storageKey} as JSON:`, e);
    console.warn(`window.sessionStorage.$${storageKey} will be replaced.`);
  }
  overrides[flagName] = overrideValue;
  window.sessionStorage.setItem(storageKey, JSON.stringify(overrides));
  console.log('New feature flag overrides in page session:',
    window.sessionStorage.getItem(storageKey));
};
