import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import UserHeaderText from '@/components/UserHeaderText.vue';

describe('UserHeaderText component', () => {
  it('renders', () => {
    const wrapper = mount(UserHeaderText, {
      props: {
        name: 'user',
        team: 'USDR',
      },
    });
    expect(wrapper.exists()).toBe(true);
  });
});
