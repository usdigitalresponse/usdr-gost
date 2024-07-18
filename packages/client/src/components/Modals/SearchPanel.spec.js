import SearchPanel from '@/components/Modals/SearchPanel.vue';

import {
  describe, it, expect, vi,
} from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { createStore } from 'vuex';

vi.mock('bootstrap-vue', async () => ({
  // SavedSearchPanel imports bootstrap-vue, which triggers an error in testing, so we'll mock it out
  VBToggle: vi.fn(),
}));

describe('SearchPanel modal component', () => {
  const store = createStore({
    getters: {
      'grants/displaySearchPanel': () => true,
      'grants/eligibilityCodes': () => [],
      'grants/fundingActivityCategories': () => [],
    },
    actions: {
      'grants/fetchSearchConfig': vi.fn(),
    },
  });

  it('renders', () => {
    const wrapper = shallowMount(SearchPanel, {
      global: {
        plugins: [store],
        stubs: ['v-select'],
      },
    });
    expect(wrapper.exists()).toBe(true);
  });
});
