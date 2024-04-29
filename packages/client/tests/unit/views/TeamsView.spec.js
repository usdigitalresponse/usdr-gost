import { expect } from 'chai';

import { createLocalVue, shallowMount } from '@vue/test-utils';
import Vuex from 'vuex';
import TeamsView from '@/views/TeamsView.vue';

const localVue = createLocalVue();
localVue.use(Vuex);

let store;
let wrapper;
const stubs = ['b-row', 'b-col', 'b-button', 'b-table', 'b-icon'];
const noOpGetters = {
  'agencies/agencies': () => [],
  'users/userRole': () => undefined,
  'users/selectedAgency': () => undefined,
};
const noOpActions = {
  'agencies/fetchAgencies': () => {},
};
afterEach(() => {
  store = undefined;
  wrapper = undefined;
});

describe('TeamsView.vue', () => {
  describe('when a non-admin loads the page', () => {
    beforeEach(() => {
      store = new Vuex.Store({
        getters: {
          ...noOpGetters,
          'users/userRole': () => 'not an admin',
        },
        actions: {
          ...noOpActions,
        },
      });
      wrapper = shallowMount(TeamsView, {
        store,
        localVue,
        stubs,
        computed: {
          newTerminologyEnabled: () => true,
        },
      });
    });
    it('should show the Teams heading', () => {
      const heading = wrapper.find('h2');
      expect(heading.text()).toEqual('Teams');
    });
    it('should not allow user to import teams', () => {
      const bulkImportButtons = wrapper.findAll('#bulkTeamImportButton');
      expect(bulkImportButtons.length).toEqual(0);
    });
    it('should not allow user to add a team', () => {
      const addButtons = wrapper.findAll('#addTeamButton');
      expect(addButtons.length).toEqual(0);
    });
    it('should not allow user to edit a team', () => {
      const editButtons = wrapper.findAll('[icon="pencil-fill"]');
      expect(editButtons.length).toEqual(0);
    });
  });
  describe('when an admin loads the page', () => {
    describe('and there are no teams', () => {
      beforeEach(() => {
        store = new Vuex.Store({
          getters: {
            ...noOpGetters,
            'users/userRole': () => 'admin',
            'users/selectedAgency': () => undefined,
          },
          actions: {
            ...noOpActions,
          },
        });
        wrapper = shallowMount(TeamsView, {
          store,
          localVue,
          stubs,
        });
      });
      it('should allow user to import teams', () => {
        const bulkImportButton = wrapper.get('#bulkTeamImportButton');
        expect(bulkImportButton.text()).to.include('Bulk Import');
      });
      it('should allow user to add a team', () => {
        const addButton = wrapper.get('#addTeamButton');
        expect(addButton.text()).to.include('Add');
      });
      it.skip('should not be able to edit a team', () => {
        const editButtons = wrapper.findAll('[icon="pencil-fill"]');
        expect(editButtons.length).toEqual(0);
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
            ...noOpGetters,
            'users/userRole': () => 'admin',
            'agencies/agencies': () => teams,
            'users/selectedAgency': () => undefined,
          },
          actions: {
            ...noOpActions,
          },
        });
        wrapper = shallowMount(TeamsView, {
          store,
          localVue,
          stubs,
        });
      });
      it.skip('should allow user to edit a team', () => {
        const editButtons = wrapper.findAll('[icon="pencil-fill"]');
        expect(editButtons.length).toEqual(1);
      });
    });
  });
});
