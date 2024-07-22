import LoginView from '@/views/LoginView.vue';

import { describe, it, expect } from 'vitest';
import { shallowMount } from '@vue/test-utils';

describe('LoginView', () => {
  const $route = {
    query: {},
  };

  it('renders', () => {
    const wrapper = shallowMount(LoginView, {
      global: {
        mocks: {
          $route,
        },
      },
    });
    expect(wrapper.exists()).toBe(true);
  });
});
