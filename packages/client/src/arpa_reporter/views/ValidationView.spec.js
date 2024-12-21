import ValidationView from '@/arpa_reporter/views/ValidationView.vue';

import {
  describe, it, expect, vi,
} from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { createStore } from 'vuex';

// Git #2362 - ValidationView is obsolete - functionality is available in UploadView
describe('ValidationView component', () => {
  const store = createStore({
    state: {
      allUploads: [],
    },
    getters: {
      viewPeriod: () => ({
        name: 'foo',
      }),
    },
    actions: {
      updateUploads: vi.fn(),
    },
  });

  it('renders', () => {
    const wrapper = shallowMount(ValidationView, {
      global: {
        plugins: [store],
      },
    });
    expect(wrapper.exists()).toBe(true);
  });
});
