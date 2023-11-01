import { expect } from 'chai';

import { createLocalVue, shallowMount } from '@vue/test-utils';
import Vuex from 'vuex';
import Agencies from '@/views/Agencies.vue';

const localVue = createLocalVue();
localVue.use(Vuex);

let store;
let wrapper;

afterEach(() => {
  store = undefined;
  wrapper = undefined;
});

describe('Agencies.vue', () => {
  describe('when a non-admin loads the page', () => {
    beforeEach(() => {
      store = new Vuex.Store({
        getters: {
          'users/userRole': () => 'not an admin',
          'agencies/agencies': () => [],
          'users/selectedAgency': () => undefined,
          'agencies/fetchAgencies': () => [],
        },
      });
      wrapper = shallowMount(Agencies, {
        store,
        localVue,
        stubs: ['b-row', 'b-col', 'b-button', 'b-table', 'b-icon'],
      });
    });
    it('should not allow user to import agencies', () => {
      const bulkImportButtons = wrapper.findAll('#bulkAgencyImportButton');
      expect(bulkImportButtons.length).to.eql(0);
    });
    it('should not allow user to add an agency', () => {
      const addButtons = wrapper.findAll('#addAgencyButton');
      expect(addButtons.length).to.eql(0);
    });
    it('should not allow user to edit an agency', () => {
      const editButtons = wrapper.findAll('[icon="pencil-fill"]');
      expect(editButtons.length).to.eql(0);
    });
  });
  describe('when an admin loads the page', () => {
    describe('and there are no agencies', () => {
      beforeEach(() => {
        store = new Vuex.Store({
          getters: {
            'users/userRole': () => 'admin',
            'agencies/agencies': () => [],
            'users/selectedAgency': () => undefined,
            'agencies/fetchAgencies': () => [],
          },
        });
        wrapper = shallowMount(Agencies, {
          store,
          localVue,
        });
      });
      it('should allow user to import agencies', () => {
        const bulkImportButton = wrapper.get('#bulkAgencyImportButton');
        expect(bulkImportButton.text()).to.include('Bulk Import');
      });
      it('should allow user to add an agency', () => {
        const addButton = wrapper.get('#addAgencyButton');
        expect(addButton.text()).to.include('Add');
      });
      it.skip('should not be able to edit an agency', () => {
        const editButtons = wrapper.findAll('[icon="pencil-fill"]');
        expect(editButtons.length).to.eql(0);
      });
    });
    describe('and there is one agency', () => {
      beforeEach(() => {
        const agencies = [
          {
            id: 1, code: '001', name: 'Agency 1', abbreviation: 'A1',
          },
        ];
        store = new Vuex.Store({
          getters: {
            'users/userRole': () => 'admin',
            'agencies/agencies': () => agencies,
            'users/selectedAgency': () => undefined,
            'agencies/fetchAgencies': () => agencies,
          },
        });
        wrapper = shallowMount(Agencies, {
          store,
          localVue,
        });
      });
      it.skip('should allow user to edit an agency', () => {
        const editButtons = wrapper.findAll('[icon="pencil-fill"]');
        expect(editButtons.length).to.eql(1);
      });
    });
  });
});
