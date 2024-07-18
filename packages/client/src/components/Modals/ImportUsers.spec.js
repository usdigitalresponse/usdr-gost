import ImportUsers from '@/components/Modals/ImportUsers.vue';

import { describe, it, expect } from 'vitest';
import { shallowMount } from '@vue/test-utils';

describe('ImportUsers modal component', () => {
  it('renders', () => {
    const wrapper = shallowMount(ImportUsers);
    expect(wrapper.exists()).toBe(true);
  });
});
