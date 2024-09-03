import NewTemplateView from '@/arpa_reporter/views/NewTemplateView.vue';

import { describe, it, expect } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { createStore } from 'vuex';

describe('NewTemplateView component', () => {
  const store = createStore({
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
      global: {
        plugins: [store],
        mocks: {
          $route,
        },
      },
    });
    expect(wrapper.exists()).toBe(true);
  });
});
