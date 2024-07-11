import NewTemplateView from '@/arpa_reporter/views/NewTemplateView.vue';

import { describe, it, expect } from 'vitest';
import { shallowMount, createLocalVue } from '@vue/test-utils';
import Vuex from 'vuex';

describe('NewTemplateView component', () => {
  const localVue = createLocalVue();
  localVue.use(Vuex);
  const store = new Vuex.Store({
    state: {
      reportingPeriods: [{
        id: 123,
        name: 'foo',
      }],
    },
  });
  const $route = {
    params: {
      id: 123,
    },
  };

  it('renders', () => {
    const wrapper = shallowMount(NewTemplateView, {
      store,
      localVue,
      mocks: {
        $route,
      },
    });
    expect(wrapper.exists()).toBe(true);
  });
});
