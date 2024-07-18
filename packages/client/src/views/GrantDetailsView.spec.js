import GrantDetailsView from '@/views/GrantDetailsView.vue';

import {
  describe, it, expect, vi,
} from 'vitest';
import { shallowMount, createLocalVue } from '@vue/test-utils';
import Vuex from 'vuex';
import { BootstrapVue } from 'bootstrap-vue';

describe('GrantDetailsView', () => {
  const localVue = createLocalVue();
  localVue.use(Vuex);
  localVue.use(BootstrapVue);
  const store = new Vuex.Store({
    getters: {
      'users/agency': () => null,
      'users/selectedAgencyId': () => null,
      'agencies/agencies': () => null,
      'users/currentTenant': () => null,
      'users/users': () => null,
      'grants/interestedCodes': () => null,
      'users/loggedInUser': () => null,
      'users/selectedAgency': () => null,
      'grants/currentGrant': () => null,
    },
    actions: {
      'grants/markGrantAsViewed': vi.fn(),
      'grants/markGrantAsInterested': vi.fn(),
      'grants/unmarkGrantAsInterested': vi.fn(),
      'grants/getInterestedAgencies': vi.fn(),
      'grants/getGrantAssignedAgencies': vi.fn(),
      'grants/assignAgenciesToGrant': vi.fn(),
      'grants/unassignAgenciesToGrant': vi.fn(),
      'agencies/fetchAgencies': vi.fn(),
      'grants/fetchGrantDetails': vi.fn(),
    },
  });
  const $route = {
    params: {
      id: 123,
    },
  };

  it('renders', () => {
    const wrapper = shallowMount(GrantDetailsView, {
      localVue,
      store,
      mocks: {
        $route,
      },
    });
    expect(wrapper.exists()).toBe(true);
  });
});
