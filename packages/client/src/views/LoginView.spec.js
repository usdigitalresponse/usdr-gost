import LoginView from '@/views/LoginView.vue';

import { describe, it, expect } from 'vitest';
import { shallowMount, createLocalVue } from '@vue/test-utils';
import { BootstrapVue } from 'bootstrap-vue';

describe('LoginView', () => {
  const localVue = createLocalVue();
  localVue.use(BootstrapVue);
  const $route = {
    query: {},
  };

  it('renders', () => {
    const wrapper = shallowMount(LoginView, {
      localVue,
      mocks: {
        $route,
      },
    });
    expect(wrapper.exists()).toBe(true);
  });
});
