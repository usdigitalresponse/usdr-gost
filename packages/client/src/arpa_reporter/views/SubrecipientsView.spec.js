import SubrecipientsView from '@/arpa_reporter/views/SubrecipientsView.vue';

import {
  describe, it, expect, vi,
} from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { createStore } from 'vuex';

describe('SubrecipientsView component', () => {
  const store = createStore({
    mutations: {
      addAlert: vi.fn(),
    },
  });

  it('renders', () => {
    const wrapper = shallowMount(SubrecipientsView, {
      global: {
        plugins: [store],
      },
    });
    expect(wrapper.exists()).toBe(true);
  });
});
