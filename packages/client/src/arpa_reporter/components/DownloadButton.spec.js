import DownloadButton from '@/arpa_reporter/components/DownloadButton.vue';

import { describe, it, expect } from 'vitest';
import { shallowMount } from '@vue/test-utils';

// TODO: Investigate and un-skip (https://github.com/usdigitalresponse/usdr-gost/issues/3259)
describe.skip('DownloadButton component', () => {
  it('renders', () => {
    const wrapper = shallowMount(DownloadButton, {
      props: {
        href: 'https://www.usdigitalresponse.org/',
      },
    });
    expect(wrapper.exists()).toBe(true);
  });
});
