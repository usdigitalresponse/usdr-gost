import ImportUsers from '@/components/Modals/ImportUsers.vue';

import { describe, it, expect } from 'vitest';
import { shallowMount, createLocalVue } from '@vue/test-utils';
import { BootstrapVue } from 'bootstrap-vue';

describe('ImportUsers modal component', () => {
  const localVue = createLocalVue();
  localVue.use(BootstrapVue);

  it('renders', () => {
    const wrapper = shallowMount(ImportUsers, {
      localVue,
    });
    expect(wrapper.exists()).toBe(true);
  });
});
