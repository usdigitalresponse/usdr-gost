import GrantsTable from '@/components/GrantsTable.vue';

import {
  describe, it, expect, vi,
} from 'vitest';
import { shallowMount, createLocalVue } from '@vue/test-utils';
import Vuex from 'vuex';
import { BootstrapVue, BootstrapVueIcons } from 'bootstrap-vue';

vi.mock('@/helpers/featureFlags', async (importOriginal) => ({
  ...await importOriginal(),
  newGrantsDetailPageEnabled: () => true,
}));

describe('GrantsTable component', () => {
  const localVue = createLocalVue();
  localVue.use(Vuex);
  localVue.use(BootstrapVue);
  localVue.use(BootstrapVueIcons);
  const store = new Vuex.Store({
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
      propsData: {
        showInterested: true,
        showRejected: true,
        showResult: true,
      },
      localVue,
      store,
      mocks: {
        $route,
      },
    });
    expect(wrapper.exists()).toBe(true);
  });
});
