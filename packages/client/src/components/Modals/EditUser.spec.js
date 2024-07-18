import EditUser from '@/components/Modals/EditUser.vue';

import { describe, it, expect } from 'vitest';
import { shallowMount } from '@vue/test-utils';

describe('EditUser modal component', () => {
  it('renders', () => {
    const wrapper = shallowMount(EditUser);
    expect(wrapper.exists()).toBe(true);
  });
});
