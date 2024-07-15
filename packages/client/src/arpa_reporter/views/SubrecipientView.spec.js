import SubrecipientView from '@/arpa_reporter/views/SubrecipientView.vue';

import {
  describe, it, expect, vi,
} from 'vitest';
import { shallowMount, createLocalVue } from '@vue/test-utils';
import Vuex from 'vuex';

describe('SubrecipientView component', () => {
  const localVue = createLocalVue();
  localVue.use(Vuex);
  const store = new Vuex.Store({
    mutations: {
      addAlert: vi.fn(),
    },
  });
  const $route = {
    params: {
      id: 123,
    },
  };

  it('renders', () => {
    const wrapper = shallowMount(SubrecipientView, {
      store,
      localVue,
      mocks: {
        $route,
      },
    });
    expect(wrapper.exists()).toBe(true);
  });
});
