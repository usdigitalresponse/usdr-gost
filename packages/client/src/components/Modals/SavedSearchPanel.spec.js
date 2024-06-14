import SavedSearchPanel from '@/components/Modals/SavedSearchPanel.vue';

import {
  describe, it, expect, vi,
} from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { createStore } from 'vuex';

vi.mock('bootstrap-vue', async () => ({
  // SavedSearchPanel imports bootstrap-vue, which triggers an error in testing, so we'll mock it out
  VBToggle: vi.fn(),
}));

describe('SavedSearchPanel modal component', () => {
  const store = createStore({
    getters: {
      'grants/savedSearches': () => [],
      'grants/displaySavedSearchPanel': () => true,
    },
    actions: {
      'grants/fetchSavedSearches': vi.fn(),
    },
  });

  it('renders', () => {
    const wrapper = shallowMount(SavedSearchPanel, {
      global: {
        plugins: [store],
      },
    });
    expect(wrapper.exists()).toBe(true);
  });
});
