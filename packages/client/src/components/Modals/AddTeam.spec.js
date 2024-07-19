import {
  describe, beforeEach, afterEach, it, expect, vi,
} from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { createStore } from 'vuex';
import AddTeam from '@/components/Modals/AddTeam.vue';

vi.mock('@/helpers/featureFlags', async (importOriginal) => ({
  ...await importOriginal(),
  newTerminologyEnabled: () => true,
}));

let store;
let wrapper;
const stubs = ['b-modal', 'v-select', 'b-form-group', 'b-form-input'];

afterEach(() => {
  store = undefined;
  wrapper = undefined;
});

describe('AddTeam.vue', () => {
  describe('when the modal is loaded', () => {
    beforeEach(() => {
      store = createStore({
        getters: {
          'users/loggedInUser': () => {},
        },
      });
      wrapper = shallowMount(AddTeam, {
        global: {
          plugins: [store],
          stubs,
        },
      });
    });
    it('should have the title Add Team', () => {
      const heading = wrapper.get('#add-agency-modal');
      expect(heading.attributes().title).toEqual('Add Team');
    });
  });
});
