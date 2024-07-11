import AgencyView from '@/arpa_reporter/views/AgencyView.vue';

import {
  describe, it, expect, vi,
} from 'vitest';
import { shallowMount, createLocalVue } from '@vue/test-utils';
import Vuex from 'vuex';

describe('AgencyView component', () => {
  const localVue = createLocalVue();
  localVue.use(Vuex);
  const store = new Vuex.Store({
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
      store,
      localVue,
      mocks: {
        $route,
      },
    });
    expect(wrapper.exists()).toBe(true);
  });
});
