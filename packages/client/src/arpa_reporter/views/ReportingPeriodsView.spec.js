import ReportingPeriodsView from '@/arpa_reporter/views/ReportingPeriodsView.vue';

import { describe, it, expect } from 'vitest';
import { shallowMount, createLocalVue } from '@vue/test-utils';
import Vuex from 'vuex';
import VueRouter from 'vue-router';

describe('ReportingPeriodsView component', () => {
  const localVue = createLocalVue();
  localVue.use(Vuex);
  localVue.use(VueRouter);
  const store = new Vuex.Store({
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
      store,
      localVue,
    });
    expect(wrapper.exists()).toBe(true);
  });
});
