import SearchPanel from '@/components/Modals/SearchPanel.vue';

import {
  describe, it, expect, vi,
} from 'vitest';
import { shallowMount, createLocalVue } from '@vue/test-utils';
import Vuex from 'vuex';
import { BootstrapVue } from 'bootstrap-vue';

describe('SearchPanel modal component', () => {
  const localVue = createLocalVue();
  localVue.use(Vuex);
  localVue.use(BootstrapVue);
  const store = new Vuex.Store({
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
      localVue,
      store,
      stubs: ['v-select'],
    });
    expect(wrapper.exists()).toBe(true);
  });
});
