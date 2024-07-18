import AddUser from '@/components/Modals/AddUser.vue';

import { describe, it, expect } from 'vitest';
import { shallowMount, createLocalVue } from '@vue/test-utils';
import Vuex from 'vuex';
import { BootstrapVue } from 'bootstrap-vue';

describe('AddUser modal component', () => {
  const localVue = createLocalVue();
  localVue.use(Vuex);
  localVue.use(BootstrapVue);
  const store = new Vuex.Store({
    getters: {
      'roles/roles': () => [{
        id: 1,
        name: 'admin',
      }],
      'agencies/agencies': () => [{
        id: 123,
      }],
    },
  });

  it('renders', () => {
    const wrapper = shallowMount(AddUser, {
      store,
      localVue,
    });
    expect(wrapper.exists()).toBe(true);
  });
});
