import { getFeatureFlags } from '@/helpers/featureFlags/utils';

export function newTerminologyEnabled() {
  return getFeatureFlags().newTerminologyEnabled === true;
}

export function newGrantsDetailPageEnabled() {
  return getFeatureFlags().newGrantsDetailPageEnabled === true;
}

export function shareTerminologyEnabled() {
  return getFeatureFlags().shareTerminologyEnabled === true;
}

export function followNotesEnabled() {
  return getFeatureFlags().followNotesEnabled === true;
}

// pagination limit for grant notes
export function grantNotesLimit() {
  return parseInt(getFeatureFlags().grantNotesLimit, 10) || 4;
}
