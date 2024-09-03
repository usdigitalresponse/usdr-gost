import ReportingPeriodView from '@/arpa_reporter/views/ReportingPeriodView.vue';

import { describe, it, expect } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { createStore } from 'vuex';

describe('ReportingPeriodView component', () => {
  const store = createStore({
    state: {
      reportingPeriods: [{
        id: 123,
        name: 'foo',
        start_date: new Date(),
        end_date: new Date(),
        template_filename: 'bar',
      }],
    },
  });
  const $route = {
    params: {
      id: 123,
    },
  };

  it('renders', () => {
    const wrapper = shallowMount(ReportingPeriodView, {
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
