import UserAvatar from '@/components/UserAvatar.vue';

import { describe, it, expect } from 'vitest';
import { shallowMount, createLocalVue } from '@vue/test-utils';
import { BootstrapVue } from 'bootstrap-vue';

describe('UserAvatar component', () => {
  const localVue = createLocalVue();
  localVue.use(BootstrapVue);

  it('renders', () => {
    const wrapper = shallowMount(UserAvatar, {
      localVue,
    });
    expect(wrapper.exists()).toBe(true);
  });
});
