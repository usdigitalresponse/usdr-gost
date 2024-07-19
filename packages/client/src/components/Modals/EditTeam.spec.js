import {
  describe, beforeEach, afterEach, it, expect, vi,
} from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { createStore } from 'vuex';
import EditTeam from '@/components/Modals/EditTeam.vue';

vi.mock('@/helpers/featureFlags', async (importOriginal) => ({
  ...await importOriginal(),
  newTerminologyEnabled: () => true,
}));

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
      store = createStore({
        getters: {
          ...noOpGetters,
        },
      });
      wrapper = shallowMount(EditTeam, {
        global: {
          plugins: [store],
          stubs,
        },
      });
    });
    it('should have the title Edit Team', () => {
      const heading = wrapper.get('#edit-agency-modal');
      expect(heading.attributes().title).toEqual('Edit Team');
    });
  });
});
