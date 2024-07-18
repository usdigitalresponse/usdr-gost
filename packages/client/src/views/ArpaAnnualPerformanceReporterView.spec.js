import ArpaAnnualPerformanceReporterView from '@/views/ArpaAnnualPerformanceReporterView.vue';

import { describe, it, expect } from 'vitest';
import { shallowMount } from '@vue/test-utils';

describe('ArpaAnnualPerformanceReporterView', () => {
  it('renders', () => {
    const wrapper = shallowMount(ArpaAnnualPerformanceReporterView);
    expect(wrapper.exists()).toBe(true);
  });
});
