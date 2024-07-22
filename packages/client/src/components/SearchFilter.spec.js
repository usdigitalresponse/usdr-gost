import SearchFilter from '@/components/SearchFilter.vue';

import { describe, it, expect } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { createStore } from 'vuex';

describe('SearchFilter component', () => {
  const store = createStore({
    getters: {
      'grants/selectedSearch': () => null,
    },
  });

  it('renders', () => {
    const wrapper = shallowMount(SearchFilter, {
      global: {
        plugins: [store],
      },
      props: {
        filterKeys: [{
          label: 'foo',
          value: 'bar',
        }],
      },
    });
    expect(wrapper.exists()).toBe(true);
  });
});
