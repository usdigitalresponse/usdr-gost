import {
  describe, beforeEach, afterEach, it, expect, vi,
} from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { createStore } from 'vuex';
import DashboardView from '@/views/DashboardView.vue';

vi.mock('@/helpers/featureFlags', async (importOriginal) => ({
  ...await importOriginal(),
  newGrantsDetailPageEnabled: () => true,
  newTerminologyEnabled: () => true,
}));

let store;
let wrapper;
const stubs = ['b-row', 'b-col', 'b-table', 'b-button', 'b-card', 'b-link', 'b-container'];
const noOpGetters = {
  'dashboard/totalGrants': () => [],
  'dashboard/totalGrantsMatchingAgencyCriteria': () => [],
  'grants/totalInterestedGrants': () => [],
  'grants/totalUpcomingGrants': () => [],
  'dashboard/grantsCreatedInTimeframe': () => [],
  'dashboard/grantsCreatedInTimeframeMatchingCriteria': () => [],
  'dashboard/grantsUpdatedInTimeframe': () => [],
  'dashboard/grantsUpdatedInTimeframeMatchingCriteria': () => [],
  'dashboard/totalInterestedGrantsByAgencies': () => [],
  'users/selectedAgency': () => undefined,
  'grants/closestGrants': () => [],
  'grants/grantsInterested': () => [],
  'grants/currentGrant': () => undefined,
};
const noOpActions = {
  'grants/fetchGrantsInterested': () => {},
  'grants/fetchClosestGrants': () => {},
};
afterEach(() => {
  store = undefined;
  wrapper = undefined;
});

describe('DashboardView.vue', () => {
  describe('when user has no interested grants"', () => {
    beforeEach(() => {
      store = createStore({
        getters: {
          ...noOpGetters,
        },
        actions: {
          ...noOpActions,
        },
      });
      wrapper = shallowMount(DashboardView, {
        global: {
          plugins: [store],
          stubs,
        },
      });
    });
    it('should show the no recent activity message', () => {
      const noRecentActivityMessage = wrapper.find('#noRecentActivityMessage');
      expect(noRecentActivityMessage.text()).toContain('Your team has no recent activity.');
    });
  });
});
