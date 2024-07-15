import ImportTeams from '@/components/Modals/ImportTeams.vue';

import { describe, it, expect } from 'vitest';
import { shallowMount, createLocalVue } from '@vue/test-utils';
import { BootstrapVue } from 'bootstrap-vue';

describe('ImportTeams modal component', () => {
  const localVue = createLocalVue();
  localVue.use(BootstrapVue);

  it('renders', () => {
    const wrapper = shallowMount(ImportTeams, {
      localVue,
    });
    expect(wrapper.exists()).toBe(true);
  });
});
