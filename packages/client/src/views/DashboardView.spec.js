import {
  describe, beforeEach, afterEach, it, expect, vi,
} from 'vitest';
import { createLocalVue, shallowMount } from '@vue/test-utils';
import Vuex from 'vuex';
import DashboardView from '@/views/DashboardView.vue';

vi.mock('@/helpers/featureFlags', async (importOriginal) => ({
  ...await importOriginal(),
  newGrantsDetailPageEnabled: () => true,
}));

const localVue = createLocalVue();
localVue.use(Vuex);

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
      store = new Vuex.Store({
        getters: {
          ...noOpGetters,
        },
        actions: {
          ...noOpActions,
        },
      });
      wrapper = shallowMount(DashboardView, {
        store,
        localVue,
        stubs,
        computed: {
          newTerminologyEnabled: () => true,
        },
      });
    });
    it('should show the no recent activity message', () => {
      const noRecentActivityMessage = wrapper.find('#noRecentActivityMessage');
      expect(noRecentActivityMessage.text()).toContain('Your team has no recent activity.');
    });
    it('should show the no recent activity message', () => {
      const noRecentActivityMessage = wrapper.find('#noUpcomingCloseDates');
      expect(noRecentActivityMessage.text()).toContain('Your team has no upcoming close dates.');
    });
  });
});
