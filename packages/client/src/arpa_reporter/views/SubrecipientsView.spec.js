import SubrecipientsView from '@/arpa_reporter/views/SubrecipientsView.vue';

import {
  describe, it, expect, vi,
} from 'vitest';
import { shallowMount, createLocalVue } from '@vue/test-utils';
import Vuex from 'vuex';

describe('SubrecipientsView component', () => {
  const localVue = createLocalVue();
  localVue.use(Vuex);
  const store = new Vuex.Store({
    mutations: {
      addAlert: vi.fn(),
    },
  });

  it('renders', () => {
    const wrapper = shallowMount(SubrecipientsView, {
      store,
      localVue,
    });
    expect(wrapper.exists()).toBe(true);
  });
});
