import ReportingPeriodView from '@/arpa_reporter/views/ReportingPeriodView.vue';

import { describe, it, expect } from 'vitest';
import { shallowMount, createLocalVue } from '@vue/test-utils';
import Vuex from 'vuex';

describe('ReportingPeriodView component', () => {
  const localVue = createLocalVue();
  localVue.use(Vuex);
  const store = new Vuex.Store({
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
      store,
      localVue,
      mocks: {
        $route,
      },
    });
    expect(wrapper.exists()).toBe(true);
  });
});
