import { getFeatureFlags } from './utils';

export function newTerminologyEnabled() {
  return getFeatureFlags().newTerminologyEnabled === true;
}

export function newGrantsDetailPageEnabled() {
  return getFeatureFlags().newGrantsDetailPageEnabled === true;
}
