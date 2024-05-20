import { createLocalVue, shallowMount } from '@vue/test-utils';
import Vuex from 'vuex';
import OrganizationsView from '@/views/OrganizationsView.vue';

const localVue = createLocalVue();
localVue.use(Vuex);

let store;
let wrapper;
const stubs = ['b-row', 'b-col', 'b-button', 'b-table', 'b-icon'];
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
      store = new Vuex.Store({
        getters: {
          ...noOpGetters,
        },
        actions: {
          ...noOpActions,
        },
      });
      wrapper = shallowMount(OrganizationsView, {
        store,
        localVue,
        stubs,
        computed: {
          newTerminologyEnabled: () => true,
        },
      });
    });
    it('should show the Organizations heading', () => {
      const heading = wrapper.find('h2');
      expect(heading.text()).toEqual('Organizations');
    });
  });
});
