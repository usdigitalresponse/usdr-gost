import GrantsTable from '@/components/GrantsTable.vue';

import {
  describe, it, expect, vi,
} from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { createStore } from 'vuex';

vi.mock('@/helpers/featureFlags', async (importOriginal) => ({
  ...await importOriginal(),
  newGrantsDetailPageEnabled: () => true,
}));

vi.mock('bootstrap-vue', async () => ({
  // SavedSearchPanel imports bootstrap-vue, which triggers an error in testing, so we'll mock it out
  VBToggle: vi.fn(),
}));

describe('GrantsTable component', () => {
  const store = createStore({
    getters: {
      'grants/grants': () => [
        {
          interested_agencies: [],
          viewed_by_agencies: [],
        },
      ],
      'grants/activeFilters': () => [],
      'grants/editingSearchId': () => null,
      'grants/selectedSearchId': () => null,
      'grants/grantsPagination': () => null,
      'users/selectedAgency': () => null,
      'users/agency': () => ({
        id: 123,
        warning_threshold: 7,
        danger_threshold: 14,
      }),
    },
    actions: {
      'grants/clearSelectedSearch': vi.fn(),
      'grants/applyFilters': vi.fn(),
      'grants/fetchGrantsNext': vi.fn(),
    },
  });
  const $route = {
    query: {},
  };

  it('renders', () => {
    const wrapper = shallowMount(GrantsTable, {
      global: {
        plugins: [store],
        mocks: {
          $route,
        },
      },
      props: {
        showInterested: true,
        showRejected: true,
        showResult: true,
      },
    });
    expect(wrapper.exists()).toBe(true);
  });
});
