import NewUploadView from '@/arpa_reporter/views/NewUploadView.vue';

import { describe, it, expect } from 'vitest';
import { shallowMount, createLocalVue } from '@vue/test-utils';
import Vuex from 'vuex';

describe('NewUploadView component', () => {
  const localVue = createLocalVue();
  localVue.use(Vuex);
  const store = new Vuex.Store({
    getters: {
      user: () => ({
        agency: {
          id: 234,
        },
      }),
      viewPeriodID: () => 123,
      viewableReportingPeriods: () => [],
    },
    state: {
      agencies: [],
    },
  });

  it('renders', () => {
    const wrapper = shallowMount(NewUploadView, {
      store,
      localVue,
    });
    expect(wrapper.exists()).toBe(true);
  });
});
