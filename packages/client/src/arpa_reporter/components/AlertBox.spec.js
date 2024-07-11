import AlertBox from '@/arpa_reporter/components/AlertBox.vue';

import { describe, it, expect } from 'vitest';
import { shallowMount } from '@vue/test-utils';

describe('AlertBox component', () => {
  it('renders', () => {
    const wrapper = shallowMount(AlertBox, {
      propsData: {
        text: 'foo',
      },
    });
    expect(wrapper.exists()).toBe(true);
  });
});
