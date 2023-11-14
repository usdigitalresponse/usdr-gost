import { expect } from 'chai';

import { createLocalVue, shallowMount } from '@vue/test-utils';
import Vuex from 'vuex';
import Dashboard from '@/views/Dashboard.vue';

const localVue = createLocalVue();
localVue.use(Vuex);

let store;
let wrapper;
const stubs = ['b-row', 'b-col', 'b-table', 'b-button', 'b-card', 'b-link', 'b-container'];
const noOpGetters = {
  'dashboard/totalGrants': () => [],
  'dashboard/totalGrantsMatchingAgencyCriteria': () => [],
  'dashboard/totalViewedGrants': () => [],
  'grants/totalInterestedGrants': () => [],
  'grants/totalUpcomingGrants': () => [],
  'dashboard/grantsCreatedInTimeframe': () => [],
  'dashboard/grantsCreatedInTimeframeMatchingCriteria': () => [],
  'dashboard/grantsUpdatedInTimeframe': () => [],
  'dashboard/grantsUpdatedInTimeframeMatchingCriteria': () => [],
  'dashboard/totalInterestedGrantsByAgencies': () => [],
  'users/selectedAgency': () => undefined,
  'grants/closestGrants': () => [],
  'grants/grants': () => [],
  'grants/grantsInterested': () => [],
  'users/agency': () => undefined,
  'grants/currentGrant': () => undefined,
};
const noOpActions = {
  'dashboard/fetchDashboard': () => {},
  'grants/fetchGrantsInterested': () => {},
  'grants/fetchClosestGrants': () => {},
};
afterEach(() => {
  store = undefined;
  wrapper = undefined;
});

describe('Dashboard.vue', () => {
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
      wrapper = shallowMount(Dashboard, {
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
      expect(noRecentActivityMessage.text()).to.include('Your team has no recent activity.');
    });
    it('should show the no recent activity message', () => {
      const noRecentActivityMessage = wrapper.find('#noUpcomingCloseDates');
      expect(noRecentActivityMessage.text()).to.include('Your team has no upcoming close dates.');
    });
  });
});
