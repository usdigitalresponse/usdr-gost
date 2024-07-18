import MyGrantsView from '@/views/MyGrantsView.vue';

import {
  describe, it, expect, vi,
} from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { createStore } from 'vuex';

vi.mock('bootstrap-vue', async () => ({
  // SavedSearchPanel imports bootstrap-vue, which triggers an error in testing, so we'll mock it out
  VBToggle: vi.fn(),
}));

describe('MyGrantsView', () => {
  const store = createStore({
    getters: {
      'users/selectedAgencyId': () => '123',
    },
  });
  const $route = {
    params: {
      tab: 'applied',
    },
    meta: {
      tabNames: ['interested', 'applied'],
    },
  };

  it('renders', () => {
    const wrapper = shallowMount(MyGrantsView, {
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
