import { expect } from 'chai';
import { createLocalVue, shallowMount } from '@vue/test-utils';
import Vuex from 'vuex';
import AddOrganization from '@/components/Modals/AddOrganization.vue';
import Vuelidate from 'vuelidate';

const localVue = createLocalVue();
localVue.use(Vuex);
localVue.use(Vuelidate);

let wrapper;
const stubs = ['b-modal', 'b-form-group', 'b-form-input'];

afterEach(() => {
  wrapper = undefined;
});

describe('AddOrganization.vue', () => {
  describe('when the modal is loaded', () => {
    beforeEach(() => {
      wrapper = shallowMount(AddOrganization, {
        localVue,
        stubs,
      });
    });
    it('should have the title Add Organization', () => {
      const heading = wrapper.get('#add-tenant-modal');
      expect(heading.attributes().title).to.eql('Add Organization');
    });
  });
});
