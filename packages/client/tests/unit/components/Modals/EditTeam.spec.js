import { expect } from 'chai';
import { createLocalVue, shallowMount } from '@vue/test-utils';
import Vuex from 'vuex';
import EditTeam from '@/components/Modals/EditTeam.vue';

const localVue = createLocalVue();
localVue.use(Vuex);

let store;
let wrapper;
const stubs = [
  'b-modal', 'v-select', 'b-form-group', 'b-form-input', 'b-button', 'b-tooltip',
];
const noOpGetters = {
  'agencies/agencies': () => [],
  'users/userRole': () => {},
};
afterEach(() => {
  store = undefined;
  wrapper = undefined;
});

describe('EditTeam.vue', () => {
  describe('when the modal is loaded', () => {
    beforeEach(() => {
      store = new Vuex.Store({
        getters: {
          ...noOpGetters,
        },
      });
      wrapper = shallowMount(EditTeam, {
        localVue,
        store,
        stubs,
        computed: {
          newTerminologyEnabled: () => true,
        },
      });
    });
    it('should have the title Edit Team', () => {
      const heading = wrapper.get('#edit-agency-modal');
      expect(heading.attributes().title).to.eql('Edit Team');
    });
  });
});
