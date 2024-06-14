import {
  describe, beforeEach, afterEach, it, expect, vi,
} from 'vitest';
import { shallowMount } from '@vue/test-utils';
import EditOrganization from '@/components/Modals/EditOrganization.vue';

vi.mock('@/helpers/featureFlags', async (importOriginal) => ({
  ...await importOriginal(),
  newTerminologyEnabled: () => true,
}));

let wrapper;

afterEach(() => {
  wrapper = undefined;
});

describe('EditOrganization.vue', () => {
  describe('when the modal is loaded', () => {
    beforeEach(() => {
      wrapper = shallowMount(EditOrganization, {
        props: {
          tenant: {
            id: 123,
            display_name: 'Foo',
          },
        },
      });
    });
    it('should have the title Edit Organization', () => {
      const heading = wrapper.get('#edit-tenant-modal');
      expect(heading.attributes().title).toEqual('Edit Organization');
    });
  });
});
