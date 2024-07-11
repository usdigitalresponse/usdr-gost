import SearchFilter from '@/components/SearchFilter.vue';

import { describe, it, expect } from 'vitest';
import { shallowMount, createLocalVue } from '@vue/test-utils';
import Vuex from 'vuex';

describe('SearchFilter component', () => {
  const localVue = createLocalVue();
  localVue.use(Vuex);
  const store = new Vuex.Store({
    getters: {
      'grants/selectedSearch': () => null,
    },
  });

  it('renders', () => {
    const wrapper = shallowMount(SearchFilter, {
      propsData: {
        filterKeys: [{
          label: 'foo',
          value: 'bar',
        }],
      },
      localVue,
      store,
    });
    expect(wrapper.exists()).toBe(true);
  });
});
