import ValidationView from '@/arpa_reporter/views/ValidationView.vue';

import {
  describe, it, expect, vi,
} from 'vitest';
import { shallowMount, createLocalVue } from '@vue/test-utils';
import Vuex from 'vuex';

describe('ValidationView component', () => {
  const localVue = createLocalVue();
  localVue.use(Vuex);
  const store = new Vuex.Store({
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
      store,
      localVue,
    });
    expect(wrapper.exists()).toBe(true);
  });
});
