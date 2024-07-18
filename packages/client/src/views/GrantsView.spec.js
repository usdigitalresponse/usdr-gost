import GrantsView from '@/views/GrantsView.vue';

import {
  describe, it, expect, vi,
} from 'vitest';
import { shallowMount } from '@vue/test-utils';

vi.mock('bootstrap-vue', async () => ({
  // SavedSearchPanel imports bootstrap-vue, which triggers an error in testing, so we'll mock it out
  VBToggle: vi.fn(),
}));

describe('GrantsView', () => {
  it('renders', () => {
    const wrapper = shallowMount(GrantsView);
    expect(wrapper.exists()).toBe(true);
  });
});
