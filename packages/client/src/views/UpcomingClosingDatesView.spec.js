import UpcomingClosingDatesView from '@/views/UpcomingClosingDatesView.vue';

import {
  describe, it, expect, vi,
} from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { createStore } from 'vuex';

vi.mock('@/helpers/featureFlags', async (importOriginal) => ({
  ...await importOriginal(),
  newGrantsDetailPageEnabled: () => true,
}));

describe('UpcomingClosingDatesView', () => {
  const store = createStore({
    getters: {
      'grants/currentGrant': () => {},
      'grants/totalUpcomingGrants': () => null,
      'users/selectedAgency': () => {},
      'grants/closestGrants': () => [],
    },
    actions: {
      'grants/fetchGrantDetails': vi.fn(),
      'grants/fetchClosestGrants': vi.fn(),
    },
  });
  const $route = {
    query: {},
  };

  it('renders', () => {
    const wrapper = shallowMount(UpcomingClosingDatesView, {
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
