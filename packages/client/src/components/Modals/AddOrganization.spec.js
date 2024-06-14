import {
  describe, beforeEach, afterEach, it, expect,
} from 'vitest';
import { shallowMount } from '@vue/test-utils';
import AddOrganization from '@/components/Modals/AddOrganization.vue';

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
        computed: {
          newTerminologyEnabled: () => true,
        },
      });
    });
    it('should have the title Add Organization', () => {
      const heading = wrapper.get('#add-tenant-modal');
      expect(heading.attributes().title).toEqual('Add Organization');
    });
  });
});
