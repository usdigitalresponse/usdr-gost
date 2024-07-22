import NotFoundView from '@/views/NotFoundView.vue';

import { describe, it, expect } from 'vitest';
import { shallowMount } from '@vue/test-utils';

describe('NotFoundView', () => {
  it('renders', () => {
    const wrapper = shallowMount(NotFoundView);
    expect(wrapper.exists()).toBe(true);
  });
});
