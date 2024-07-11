import {
  describe, beforeEach, afterEach, it, expect, vi,
} from 'vitest';
import { createLocalVue, shallowMount } from '@vue/test-utils';
import Vuex from 'vuex';
import EditOrganization from '@/components/Modals/EditOrganization.vue';

vi.mock('@/helpers/featureFlags', async (importOriginal) => ({
  ...await importOriginal(),
  newTerminologyEnabled: () => true,
}));

const localVue = createLocalVue();
localVue.use(Vuex);

let wrapper;
const stubs = ['b-modal', 'b-form-group', 'b-form-input'];

afterEach(() => {
  wrapper = undefined;
});

describe('EditOrganization.vue', () => {
  describe('when the modal is loaded', () => {
    beforeEach(() => {
      wrapper = shallowMount(EditOrganization, {
        propsData: {
          tenant: {
            id: 123,
            display_name: 'Foo',
          },
        },
        localVue,
        stubs,
      });
    });
    it('should have the title Edit Organization', () => {
      const heading = wrapper.get('#edit-tenant-modal');
      expect(heading.attributes().title).toEqual('Edit Organization');
    });
  });
});
