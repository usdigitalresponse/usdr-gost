import {
  describe, beforeEach, afterEach, it, expect, vi,
} from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { createStore } from 'vuex';
import BaseLayout from '@/components/BaseLayout.vue';

vi.mock('@/helpers/featureFlags', async (importOriginal) => ({
  ...await importOriginal(),
  newTerminologyEnabled: () => true,
}));

let store;
let wrapper;

afterEach(() => {
  store = undefined;
  wrapper = undefined;
});
const defaultRoute = {
  meta: {
    hideLayoutTabs: false,
  },
};
const stubs = ['router-view'];
const noOpGetters = {
  'users/selectedAgency': () => {},
  'users/loggedInUser': () => {},
  'users/userRole': () => {},
  'alerts/alerts': () => [],
};

describe('BaseLayout.vue', () => {
  describe('when Layout view is loaded', () => {
    beforeEach(() => {
      store = createStore({
        getters: { ...noOpGetters },
      });
      wrapper = shallowMount(BaseLayout, {
        global: {
          plugins: [store],
          mocks: {
            $route: defaultRoute,
          },
          stubs,
        },
      });
    });
    it('should show the Grants heading', () => {
      const layoutHeader = wrapper.get('h1');
      expect(layoutHeader.text()).toContain('Federal Grant Finder');
    });
    it('should show My Grants tab', () => {
      const navItem = wrapper.get('[to="/my-grants"]');
      expect(navItem.text()).toEqual('My Grants');
    });
    it('should show Browse Grants tab', () => {
      const navItem = wrapper.get('[to="/grants"]');
      expect(navItem.text()).toEqual('Browse Grants');
    });
    it('should show Dashboard tab', () => {
      const navItem = wrapper.get('[to="/dashboard"]');
      expect(navItem.text()).toEqual('Dashboard');
    });
    it('should show Teams tab', () => {
      const navItem = wrapper.get('[to="/teams"]');
      expect(navItem.text()).toEqual('Teams');
    });
  });
  describe('when user is logged in', () => {
    beforeEach(() => {
      store = createStore({
        getters: {
          ...noOpGetters,
          'users/loggedInUser': () => ({}),
        },
      });
      wrapper = shallowMount(BaseLayout, {
        global: {
          plugins: [store],
          mocks: {
            $route: defaultRoute,
          },
          stubs,
        },
      });
    });
    it('should have a dropdown', () => {
      const dropdown = wrapper.findComponent({ name: 'b-nav-item-dropdown' });

      expect(dropdown.exists()).toEqual(true);
    });
    it('should have the correct options', () => {
      const options = wrapper.findAll('.dropdown-item-text');
      expect(options.length).toEqual(4);
      expect(options.at(0).text()).toEqual('My profile');
      expect(options.at(1).text()).toEqual('Give feedback');
      expect(options.at(2).text()).toEqual('Training guide');
      expect(options.at(3).text()).toEqual('Sign out');
    });
  });
  describe('when user is admin', () => {
    beforeEach(() => {
      store = createStore({
        getters: {
          ...noOpGetters,
          'users/userRole': () => 'admin',
        },
      });
      wrapper = shallowMount(BaseLayout, {
        global: {
          plugins: [store],
          mocks: {
            $route: defaultRoute,
          },
          stubs,
        },
      });
    });

    it('should show Users tab', () => {
      const navItem = wrapper.get('[to="/users"]');
      expect(navItem.text()).toEqual('Users');
    });
  });
  describe('when user is super admin', () => {
    beforeEach(() => {
      store = createStore({
        getters: {
          ...noOpGetters,
          'users/loggedInUser': () => ({ isUSDRSuperAdmin: true }),
        },
      });
      wrapper = shallowMount(BaseLayout, {
        global: {
          plugins: [store],
          mocks: {
            $route: defaultRoute,
          },
          stubs,
        },
      });
    });

    it('should show Organizations tab', () => {
      const navItem = wrapper.get('[to="/organizations"]');
      expect(navItem.text()).toEqual('Organizations');
    });
  });
});
