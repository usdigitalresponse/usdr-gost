import CopyButton from '@/components/CopyButton.vue';

import { describe, it, expect } from 'vitest';
import { shallowMount } from '@vue/test-utils';

// TODO: Investigate and un-skip (https://github.com/usdigitalresponse/usdr-gost/issues/3259)
describe.skip('CopyButton component', () => {
  it('renders', () => {
    const wrapper = shallowMount(CopyButton, {
      props: {
        copyText: 'foo',
      },
    });
    expect(wrapper.exists()).toBe(true);
  });
});
