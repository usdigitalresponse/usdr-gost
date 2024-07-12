import UpcomingClosingDatesView from '@/views/UpcomingClosingDatesView.vue';

import {
  describe, it, expect, vi,
} from 'vitest';
import { shallowMount, createLocalVue } from '@vue/test-utils';
import Vuex from 'vuex';
import { BootstrapVue } from 'bootstrap-vue';

vi.mock('@/helpers/featureFlags', async (importOriginal) => ({
  ...await importOriginal(),
  newGrantsDetailPageEnabled: () => true,
}));

describe('UpcomingClosingDatesView', () => {
  const localVue = createLocalVue();
  localVue.use(Vuex);
  localVue.use(BootstrapVue);
  const store = new Vuex.Store({
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
      localVue,
      store,
      mocks: {
        $route,
      },
    });
    expect(wrapper.exists()).toBe(true);
  });
});
