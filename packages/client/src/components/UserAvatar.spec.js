import UserAvatar from '@/components/UserAvatar.vue';

import { describe, it, expect } from 'vitest';
import { shallowMount } from '@vue/test-utils';

describe('UserAvatar component', () => {
  it('renders', () => {
    const wrapper = shallowMount(UserAvatar);
    expect(wrapper.exists()).toBe(true);
  });
});
