// Utility functions to wrap the Google Analytics gtag API.
// Note that the 'set' command does not appear to do anything (despite Google documentation to the contrary) so all
// runtime reconfiguration is being performed via 'config'.

/**
 * If Google Analytics are enabled, calls the config command on the appropriate Google tag.
 * If called repeatedly, appears to update the config by performing a deep merge of the existing config with the new.
 * Note that the tag must be configured with "Ignore duplicate instances of on-page configuration" set to off in order
 * for repeated calls to work.
 *
 * @param config - A configuration object that will affect handling for all subsequent events. See GA4 docs for details.
 *                 Can be used to, for instance, add parameters that will be sent along with all events.
 */
export function gtagConfig(config) {
  // See index.html for the definition of the gtag function.
  if (typeof window.gtag === 'function' && window.APP_CONFIG?.GOOGLE_TAG_ID) {
    window.gtag('config', window.APP_CONFIG.GOOGLE_TAG_ID, config);
  }
}

export function setUserForGoogleAnalytics(user) {
  gtagConfig({
    user_id: user?.id,
    user_properties: {
      team_id: user?.agency_id,
      organization_id: user?.tenant_id,
    },
  });
}
