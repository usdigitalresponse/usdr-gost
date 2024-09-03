import {
  describe, beforeEach, afterEach, it, expect, vi,
} from 'vitest';
import { shallowMount } from '@vue/test-utils';
import AddOrganization from '@/components/Modals/AddOrganization.vue';

vi.mock('@/helpers/featureFlags', async (importOriginal) => ({
  ...await importOriginal(),
  newTerminologyEnabled: () => true,
}));

let wrapper;
const stubs = ['b-modal', 'b-form-group', 'b-form-input'];

afterEach(() => {
  wrapper = undefined;
});

describe('AddOrganization.vue', () => {
  describe('when the modal is loaded', () => {
    beforeEach(() => {
      wrapper = shallowMount(AddOrganization, {
        global: {
          stubs,
        },
      });
    });
    it('should have the title Add Organization', () => {
      const heading = wrapper.get('#add-tenant-modal');
      expect(heading.attributes().title).toEqual('Add Organization');
    });
  });
});
