import { expect } from 'chai';

import { createLocalVue, shallowMount } from '@vue/test-utils';
import Vuex from 'vuex';
import Teams from '@/views/Teams.vue';

const localVue = createLocalVue();
localVue.use(Vuex);

let store;
let wrapper;

afterEach(() => {
  store = undefined;
  wrapper = undefined;
});

describe('Teams.vue', () => {
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
      wrapper = shallowMount(Teams, {
        store,
        localVue,
        stubs: ['b-row', 'b-col', 'b-button', 'b-table', 'b-icon'],
      });
    });
    it('should show the Teams heading', () => {
      const heading = wrapper.find('h2');
      expect(heading.text()).to.eql('Teams');
    });
    it('should not allow user to import teams', () => {
      const bulkImportButtons = wrapper.findAll('#bulkTeamImportButton');
      expect(bulkImportButtons.length).to.eql(0);
    });
    it('should not allow user to add an team', () => {
      const addButtons = wrapper.findAll('#addTeamButton');
      expect(addButtons.length).to.eql(0);
    });
    it('should not allow user to edit an team', () => {
      const editButtons = wrapper.findAll('[icon="pencil-fill"]');
      expect(editButtons.length).to.eql(0);
    });
  });
  describe('when an admin loads the page', () => {
    describe('and there are no teams', () => {
      beforeEach(() => {
        store = new Vuex.Store({
          getters: {
            'users/userRole': () => 'admin',
            'agencies/agencies': () => [],
            'users/selectedAgency': () => undefined,
            'agencies/fetchAgencies': () => [],
          },
        });
        wrapper = shallowMount(Teams, {
          store,
          localVue,
        });
      });
      it('should allow user to import teams', () => {
        const bulkImportButton = wrapper.get('#bulkTeamImportButton');
        expect(bulkImportButton.text()).to.include('Bulk Import');
      });
      it('should allow user to add an team', () => {
        const addButton = wrapper.get('#addTeamButton');
        expect(addButton.text()).to.include('Add');
      });
      it.skip('should not be able to edit a team', () => {
        const editButtons = wrapper.findAll('[icon="pencil-fill"]');
        expect(editButtons.length).to.eql(0);
      });
    });
    describe('and there is one team', () => {
      beforeEach(() => {
        const teams = [
          {
            id: 1, code: '001', name: 'Team 1', abbreviation: 'A1',
          },
        ];
        store = new Vuex.Store({
          getters: {
            'users/userRole': () => 'admin',
            'agencies/agencies': () => teams,
            'users/selectedAgency': () => undefined,
            'agencies/fetchAgencies': () => teams,
          },
        });
        wrapper = shallowMount(Teams, {
          store,
          localVue,
        });
      });
      it.skip('should allow user to edit an team', () => {
        const editButtons = wrapper.findAll('[icon="pencil-fill"]');
        expect(editButtons.length).to.eql(1);
      });
    });
  });
});
