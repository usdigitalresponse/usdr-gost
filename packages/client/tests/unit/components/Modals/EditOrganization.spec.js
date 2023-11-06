import { expect } from 'chai';
import { createLocalVue, shallowMount } from '@vue/test-utils';
import Vuex from 'vuex';
import Vuelidate from 'vuelidate';
import EditOrganization from '@/components/Modals/EditOrganization.vue';

const localVue = createLocalVue();
localVue.use(Vuex);
localVue.use(Vuelidate);

let wrapper;
const stubs = ['b-modal', 'b-form-group', 'b-form-input'];

afterEach(() => {
  wrapper = undefined;
});

describe('EditOrganization.vue', () => {
  describe('when the modal is loaded', () => {
    beforeEach(() => {
      wrapper = shallowMount(EditOrganization, {
        localVue,
        stubs,
      });
    });
    it('should have the title Edit Organization', () => {
      const heading = wrapper.get('#edit-tenant-modal');
      expect(heading.attributes().title).to.eql('Edit Organization');
    });
  });
});
