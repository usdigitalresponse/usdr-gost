import { expect } from 'chai';

import { createLocalVue, shallowMount } from '@vue/test-utils';
import Vuex from 'vuex';
import Dashboard from '@/views/Dashboard.vue';

const localVue = createLocalVue();
localVue.use(Vuex);

let store;
let wrapper;

afterEach(() => {
  store = undefined;
  wrapper = undefined;
});

describe('Dashboard.vue', () => {
  describe('when user has no interested grants"', () => {
    beforeEach(() => {
      store = new Vuex.Store({
        getters: {
          'grants/fetchGrantsInterested': () => [],
          'grants/closestGrants': () => [],
        },
      });
      wrapper = shallowMount(Dashboard, {
        store,
        localVue,
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
