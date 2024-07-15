import RecentActivityView from '@/views/RecentActivityView.vue';

import {
  describe, it, expect, vi,
} from 'vitest';
import { shallowMount, createLocalVue } from '@vue/test-utils';
import Vuex from 'vuex';
import { BootstrapVue, BootstrapVueIcons } from 'bootstrap-vue';

vi.mock('@/helpers/featureFlags', async (importOriginal) => ({
  ...await importOriginal(),
  newGrantsDetailPageEnabled: () => true,
}));

describe('RecentActivityView', () => {
  const localVue = createLocalVue();
  localVue.use(Vuex);
  localVue.use(BootstrapVue);
  localVue.use(BootstrapVueIcons);
  const store = new Vuex.Store({
    getters: {
      'grants/grants': () => null,
      'grants/grantsInterested': () => [],
      'grants/totalInterestedGrants': () => null,
      'grants/currentGrant': () => null,
    },
    actions: {
      'grants/fetchGrantsInterested': vi.fn(),
      'grants/fetchGrantDetails': vi.fn(),
      'grants/exportCSVRecentActivities': vi.fn(),
    },
  });
  const $route = {
    query: {},
  };

  it('renders', () => {
    const wrapper = shallowMount(RecentActivityView, {
      localVue,
      store,
      mocks: {
        $route,
      },
    });
    expect(wrapper.exists()).toBe(true);
  });
});
