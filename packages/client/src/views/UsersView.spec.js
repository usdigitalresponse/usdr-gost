import UsersView from '@/views/UsersView.vue';

import {
  describe, it, expect, vi,
} from 'vitest';
import { shallowMount, createLocalVue } from '@vue/test-utils';
import Vuex from 'vuex';
import { BootstrapVue } from 'bootstrap-vue';

vi.mock('@/helpers/featureFlags', async (importOriginal) => ({
  ...await importOriginal(),
  newGrantsDetailPageEnabled: () => true,
}));

describe('UsersView', () => {
  const localVue = createLocalVue();
  localVue.use(Vuex);
  localVue.use(BootstrapVue);
  const store = new Vuex.Store({
    getters: {
      'users/loggedInUser': () => null,
      'users/users': () => [{
        id: 123,
        name: 'foo',
        email: 'foo@bar.com',
        role: {
          id: 1,
          name: 'admin',
        },
        agency: {
          id: 234,
          name: 'Foo',
          abbreviation: 'F',
        },
      }],
      'users/userRole': () => null,
      'users/selectedAgency': () => null,
    },
    actions: {
      'users/fetchUsers': vi.fn(),
      'users/deleteUser': vi.fn(),
    },
  });

  it('renders', () => {
    const wrapper = shallowMount(UsersView, {
      localVue,
      store,
    });
    expect(wrapper.exists()).toBe(true);
  });
});
