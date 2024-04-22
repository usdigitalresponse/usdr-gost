import { expect } from 'chai';

import { createLocalVue, shallowMount } from '@vue/test-utils';
import Vuex from 'vuex';
import BaseLayout from '@/components/BaseLayout.vue';

const localVue = createLocalVue();
localVue.use(Vuex);

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
const stubs = ['b-nav-item-dropdown', 'b-navbar', 'b-navbar-nav', 'b-collapse', 'b-navbar-brand', 'b-img', 'b-nav-item', 'b-dropdown-item', 'b-dropdown-item-button', 'b-col', 'b-nav', 'router-view', 'b-badge', 'b-nav-text'];
const noOpGetters = {
  'users/selectedAgency': () => {},
  'users/loggedInUser': () => {},
  'users/userRole': () => {},
  'alerts/alerts': () => [],
};

describe('BaseLayout.vue', () => {
  describe('when Layout view is loaded', () => {
    beforeEach(() => {
      store = new Vuex.Store({
        getters: { ...noOpGetters },
      });
      wrapper = shallowMount(BaseLayout, {
        localVue,
        store,
        mocks: {
          $route: defaultRoute,
        },
        stubs,
        computed: {
          newTerminologyEnabled: () => true,
        },
      });
    });
    it('should show the Grants heading', () => {
      const layoutHeader = wrapper.get('h1');
      expect(layoutHeader.text()).to.include('Federal Grant Finder');
    });
    it('should show My Grants tab', () => {
      const navItem = wrapper.get('[to="/my-grants"]');
      expect(navItem.text()).to.eql('My Grants');
    });
    it('should show Browse Grants tab', () => {
      const navItem = wrapper.get('[to="/grants"]');
      expect(navItem.text()).to.eql('Browse Grants');
    });
    it('should show Dashboard tab', () => {
      const navItem = wrapper.get('[to="/dashboard"]');
      expect(navItem.text()).to.eql('Dashboard');
    });
    it('should show Teams tab', () => {
      const navItem = wrapper.get('[to="/teams"]');
      expect(navItem.text()).to.eql('Teams');
    });
  });
  describe('when user is logged in', () => {
    beforeEach(() => {
      store = new Vuex.Store({
        getters: {
          ...noOpGetters,
          'users/loggedInUser': () => ({}),
        },
      });
      wrapper = shallowMount(BaseLayout, {
        localVue,
        store,
        mocks: {
          $route: defaultRoute,
        },
        stubs,
      });
    });
    it('should have a dropdown', () => {
      wrapper.get('b-nav-item-dropdown-stub');
    });
    it('should have the correct options', () => {
      const options = wrapper.findAll('.dropdown-item-text');
      expect(options.length).to.eql(4);
      expect(options.at(0).text()).to.eql('My profile');
      expect(options.at(1).text()).to.eql('Give feedback');
      expect(options.at(2).text()).to.eql('Training guide');
      expect(options.at(3).text()).to.eql('Sign out');
    });
  });
  describe('when user is admin', () => {
    beforeEach(() => {
      store = new Vuex.Store({
        getters: {
          ...noOpGetters,
          'users/userRole': () => 'admin',
        },
      });
      wrapper = shallowMount(BaseLayout, {
        localVue,
        store,
        mocks: {
          $route: defaultRoute,
        },
        stubs,
      });
    });

    it('should show Users tab', () => {
      const navItem = wrapper.get('[to="/users"]');
      expect(navItem.text()).to.eql('Users');
    });
  });
  describe('when user is super admin', () => {
    beforeEach(() => {
      store = new Vuex.Store({
        getters: {
          ...noOpGetters,
          'users/loggedInUser': () => ({ isUSDRSuperAdmin: true }),
        },
      });
      wrapper = shallowMount(BaseLayout, {
        localVue,
        store,
        mocks: {
          $route: defaultRoute,
        },
        stubs,
        computed: {
          newTerminologyEnabled: () => true,
        },
      });
    });

    it('should show Organizations tab', () => {
      const navItem = wrapper.get('b-nav-item-stub[to="/organizations"]');
      expect(navItem.text()).to.eql('Organizations');
    });
  });
});
