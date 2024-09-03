import UsersView from '@/arpa_reporter/views/UsersView.vue';

import {
  describe, it, expect, vi,
} from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { createStore } from 'vuex';

describe('UsersView component', () => {
  const store = createStore({
    mutations: {
      addAlert: vi.fn(),
    },
  });

  it('renders', () => {
    const wrapper = shallowMount(UsersView, {
      global: {
        plugins: [store],
      },
    });
    expect(wrapper.exists()).toBe(true);
  });
});
