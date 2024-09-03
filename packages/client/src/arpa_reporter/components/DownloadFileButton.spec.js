import DownloadFileButton from '@/arpa_reporter/components/DownloadFileButton.vue';

import { describe, it, expect } from 'vitest';
import { shallowMount } from '@vue/test-utils';

describe('DownloadFileButton component', () => {
  it('renders', () => {
    const wrapper = shallowMount(DownloadFileButton, {
      props: {
        upload: {
          id: 123,
        },
      },
    });
    expect(wrapper.exists()).toBe(true);
  });
});
