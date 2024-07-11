import ArpaAnnualPerformanceReporterView from '@/views/ArpaAnnualPerformanceReporterView.vue';

import { describe, it, expect } from 'vitest';
import { shallowMount, createLocalVue } from '@vue/test-utils';
import { BootstrapVue } from 'bootstrap-vue';

describe('ArpaAnnualPerformanceReporterView', () => {
  const localVue = createLocalVue();
  localVue.use(BootstrapVue);

  it('renders', () => {
    const wrapper = shallowMount(ArpaAnnualPerformanceReporterView, {
      localVue,
    });
    expect(wrapper.exists()).toBe(true);
  });
});
