import UsersView from '@/views/UsersView.vue';

import {
  describe, it, expect, vi,
} from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { createStore } from 'vuex';

vi.mock('@/helpers/featureFlags', async (importOriginal) => ({
  ...await importOriginal(),
  newGrantsDetailPageEnabled: () => true,
}));

describe('UsersView', () => {
  const store = createStore({
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
      global: {
        plugins: [store],
      },
    });
    expect(wrapper.exists()).toBe(true);
  });
});
