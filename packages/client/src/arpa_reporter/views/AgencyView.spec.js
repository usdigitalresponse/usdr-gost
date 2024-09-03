import AgencyView from '@/arpa_reporter/views/AgencyView.vue';

import {
  describe, it, expect, vi,
} from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { createStore } from 'vuex';

describe('AgencyView component', () => {
  const store = createStore({
    state: {
      agencies: [],
    },
    actions: {
      updateAgencies: vi.fn(),
    },
  });
  const $route = {
    params: {
      id: 123,
    },
  };

  it('renders', () => {
    const wrapper = shallowMount(AgencyView, {
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
