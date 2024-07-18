import SavedSearchPanel from '@/components/Modals/SavedSearchPanel.vue';

import {
  describe, it, expect, vi,
} from 'vitest';
import { shallowMount, createLocalVue } from '@vue/test-utils';
import Vuex from 'vuex';
import { BootstrapVue } from 'bootstrap-vue';

describe('SavedSearchPanel modal component', () => {
  const localVue = createLocalVue();
  localVue.use(Vuex);
  localVue.use(BootstrapVue);
  const store = new Vuex.Store({
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
      localVue,
      store,
    });
    expect(wrapper.exists()).toBe(true);
  });
});
