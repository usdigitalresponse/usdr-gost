import ImportTeams from '@/components/Modals/ImportTeams.vue';

import { describe, it, expect } from 'vitest';
import { shallowMount } from '@vue/test-utils';

describe('ImportTeams modal component', () => {
  it('renders', () => {
    const wrapper = shallowMount(ImportTeams);
    expect(wrapper.exists()).toBe(true);
  });
});
