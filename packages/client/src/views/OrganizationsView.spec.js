import {
  describe, beforeEach, afterEach, it, expect, vi,
} from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { createStore } from 'vuex';
import OrganizationsView from '@/views/OrganizationsView.vue';

vi.mock('@/helpers/featureFlags', async (importOriginal) => ({
  ...await importOriginal(),
  newTerminologyEnabled: () => true,
}));

let store;
let wrapper;
const noOpGetters = {
  'users/selectedAgency': () => {},
  'tenants/tenants': () => [],
};
const noOpActions = {
  'tenants/fetchTenants': () => {},
};
afterEach(() => {
  store = undefined;
  wrapper = undefined;
});

describe('OrganizationsView.vue', () => {
  describe('when the view is loaded', () => {
    beforeEach(() => {
      store = createStore({
        getters: {
          ...noOpGetters,
        },
        actions: {
          ...noOpActions,
        },
      });
      wrapper = shallowMount(OrganizationsView, {
        global: {
          plugins: [store],
        },
      });
    });
    it('should show the Organizations heading', () => {
      const heading = wrapper.find('h2');
      expect(heading.text()).toEqual('Organizations');
    });
  });
});
