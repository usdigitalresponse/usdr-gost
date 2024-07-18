import NewUploadView from '@/arpa_reporter/views/NewUploadView.vue';

import { describe, it, expect } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { createStore } from 'vuex';

describe('NewUploadView component', () => {
  const store = createStore({
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
      global: {
        plugins: [store],
      },
    });
    expect(wrapper.exists()).toBe(true);
  });
});
