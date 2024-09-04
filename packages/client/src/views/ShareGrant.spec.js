import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import {
  shallowMount,
} from '@vue/test-utils';
import { createStore } from 'vuex';

import ShareGrant from '@/views/ShareGrant.vue';

describe('ShareGrant', () => {
  const mockStore = {
    getters: {
      'agencies/agencies': () => [],
      'grants/currentGrant': () => ({
        grant_id: 55,
      }),
    },
    actions: {
      'grants/getGrantAssignedAgencies': vi.fn(),
      'grants/assignAgenciesToGrant': vi.fn(),
      'grants/unassignAgenciesToGrant': vi.fn(),
      'agencies/fetchAgencies': vi.fn(),
    },
  };

  const store = createStore(mockStore);

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders', () => {
    const wrapper = shallowMount(ShareGrant, {
      global: {
        plugins: [store],
      },
    });
    expect(wrapper.exists()).toBe(true);
  });
});
