import { expect } from 'chai';

import { createLocalVue, shallowMount } from '@vue/test-utils';
import Vuex from 'vuex';
import Organizations from '@/views/Organizations.vue';

const localVue = createLocalVue();
localVue.use(Vuex);

let store;
let wrapper;

afterEach(() => {
  store = undefined;
  wrapper = undefined;
});

describe('Organizations.vue', () => {
  describe('when the view is loaded', () => {
    beforeEach(() => {
      store = new Vuex.Store({
        getters: {
          'users/userRole': () => 'admin',
          'users/selectedAgency': () => undefined,
          'agencies/fetchAgencies': () => [],
        },
      });
      wrapper = shallowMount(Organizations, {
        store,
        localVue,
      });
    });
    it('should show the Organizations heading', () => {
      const heading = wrapper.find('h2');
      expect(heading.text()).to.eql('Organizations');
    });
  });
});
