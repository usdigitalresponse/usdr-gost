import EditUser from '@/components/Modals/EditUser.vue';

import { describe, it, expect } from 'vitest';
import { shallowMount, createLocalVue } from '@vue/test-utils';
import { BootstrapVue } from 'bootstrap-vue';

describe('EditUser modal component', () => {
  const localVue = createLocalVue();
  localVue.use(BootstrapVue);

  it('renders', () => {
    const wrapper = shallowMount(EditUser, {
      localVue,
    });
    expect(wrapper.exists()).toBe(true);
  });
});
