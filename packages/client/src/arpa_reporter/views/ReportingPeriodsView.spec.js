import ReportingPeriodsView from '@/arpa_reporter/views/ReportingPeriodsView.vue';

import { describe, it, expect } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { createStore } from 'vuex';

describe('ReportingPeriodsView component', () => {
  const store = createStore({
    state: {
      reportingPeriods: [{
        id: 234,
        name: 'foo',
        start_date: new Date(),
        end_date: new Date(),
        template_filename: 'bar',
      }],
    },
    getters: {
      currentReportingPeriod: () => ({
        id: 234,
      }),
    },
  });

  it('renders', () => {
    const wrapper = shallowMount(ReportingPeriodsView, {
      global: {
        plugins: [store],
      },
    });
    expect(wrapper.exists()).toBe(true);
  });
});
