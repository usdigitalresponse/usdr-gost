import DownloadTemplateBtn from '@/arpa_reporter/components/DownloadTemplateBtn.vue';

import { describe, it, expect } from 'vitest';
import { createLocalVue, shallowMount } from '@vue/test-utils';
import Vuex from 'vuex';

describe('DownloadTemplateBtn component', () => {
  const localVue = createLocalVue();
  localVue.use(Vuex);
  const store = new Vuex.Store({
    state: {
      viewPEriodID: 123,
    },
    getters: {
      viewPeriodIsCurrent: () => true,
    },
  });

  it('renders', () => {
    const wrapper = shallowMount(DownloadTemplateBtn, {
      store,
      localVue,
      propsData: {
        block: true,
      },
    });
    expect(wrapper.exists()).toBe(true);
  });
});
