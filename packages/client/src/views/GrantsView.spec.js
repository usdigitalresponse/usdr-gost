import GrantsView from '@/views/GrantsView.vue';

import { describe, it, expect } from 'vitest';
import { shallowMount } from '@vue/test-utils';

describe('GrantsView', () => {
  it('renders', () => {
    const wrapper = shallowMount(GrantsView);
    expect(wrapper.exists()).toBe(true);
  });
});
