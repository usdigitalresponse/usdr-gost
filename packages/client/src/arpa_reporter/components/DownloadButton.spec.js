import DownloadButton from '@/arpa_reporter/components/DownloadButton.vue';

import { describe, it, expect } from 'vitest';
import { shallowMount } from '@vue/test-utils';

describe('DownloadButton component', () => {
  it('renders', () => {
    const wrapper = shallowMount(DownloadButton, {
      propsData: {
        href: 'https://www.usdigitalresponse.org/',
      },
    });
    expect(wrapper.exists()).toBe(true);
  });
});
