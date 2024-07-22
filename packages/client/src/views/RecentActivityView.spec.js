import RecentActivityView from '@/views/RecentActivityView.vue';

import {
  describe, it, expect, vi,
} from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { createStore } from 'vuex';

vi.mock('@/helpers/featureFlags', async (importOriginal) => ({
  ...await importOriginal(),
  newGrantsDetailPageEnabled: () => true,
}));

describe('RecentActivityView', () => {
  const store = createStore({
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
      global: {
        plugins: [store],
        mocks: {
          $route,
        },
      },
    });
    expect(wrapper.exists()).toBe(true);
  });
});
