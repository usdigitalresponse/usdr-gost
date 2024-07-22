import LoginView from '@/arpa_reporter/views/LoginView.vue';

import { describe, it, expect } from 'vitest';
import { shallowMount } from '@vue/test-utils';

describe('LoginView component', () => {
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
