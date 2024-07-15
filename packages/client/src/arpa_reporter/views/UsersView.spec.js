import UsersView from '@/arpa_reporter/views/UsersView.vue';

import {
  describe, it, expect, vi,
} from 'vitest';
import { shallowMount, createLocalVue } from '@vue/test-utils';
import Vuex from 'vuex';
import VueRouter from 'vue-router';

describe('UsersView component', () => {
  const localVue = createLocalVue();
  localVue.use(Vuex);
  localVue.use(VueRouter);
  const store = new Vuex.Store({
    mutations: {
      addAlert: vi.fn(),
    },
  });

  it('renders', () => {
    const wrapper = shallowMount(UsersView, {
      store,
      localVue,
    });
    expect(wrapper.exists()).toBe(true);
  });
});
