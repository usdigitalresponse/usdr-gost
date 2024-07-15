import DownloadFileButtonSmall from '@/arpa_reporter/components/DownloadFileButtonSmall.vue';

import { describe, it, expect } from 'vitest';
import { shallowMount } from '@vue/test-utils';

describe('DownloadFileButtonSmall component', () => {
  it('renders', () => {
    const wrapper = shallowMount(DownloadFileButtonSmall, {
      propsData: {
        upload: {
          id: 123,
        },
      },
    });
    expect(wrapper.exists()).toBe(true);
  });
});
