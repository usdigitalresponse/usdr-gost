import RecordUploader from '@/components/RecordUploader.vue';

import { describe, it, expect } from 'vitest';
import { shallowMount } from '@vue/test-utils';

describe('RecordUploader component', () => {
  it('renders', () => {
    const wrapper = shallowMount(RecordUploader, {
      props: {
        uploadRecordType: 'user',
      },
    });
    expect(wrapper.exists()).toBe(true);
  });
});
