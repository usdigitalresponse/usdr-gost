import MyGrantsView from '@/views/MyGrantsView.vue';

import { describe, it, expect } from 'vitest';
import { shallowMount, createLocalVue } from '@vue/test-utils';
import Vuex from 'vuex';
import { BootstrapVue } from 'bootstrap-vue';

describe('MyGrantsView', () => {
  const localVue = createLocalVue();
  localVue.use(Vuex);
  localVue.use(BootstrapVue);
  const store = new Vuex.Store({
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
      localVue,
      store,
      mocks: {
        $route,
      },
    });
    expect(wrapper.exists()).toBe(true);
  });
});
