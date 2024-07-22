import DownloadTemplateBtn from '@/arpa_reporter/components/DownloadTemplateBtn.vue';

import { describe, it, expect } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { createStore } from 'vuex';

describe('DownloadTemplateBtn component', () => {
  const store = createStore({
    state: {
      viewPEriodID: 123,
    },
    getters: {
      viewPeriodIsCurrent: () => true,
    },
  });

  it('renders', () => {
    const wrapper = shallowMount(DownloadTemplateBtn, {
      global: {
        plugins: [store],
      },
      props: {
        block: true,
      },
    });
    expect(wrapper.exists()).toBe(true);
  });
});
