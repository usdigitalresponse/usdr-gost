import AddUser from '@/components/Modals/AddUser.vue';

import { describe, it, expect } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { createStore } from 'vuex';

describe('AddUser modal component', () => {
  const store = createStore({
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
      global: {
        plugins: [store],
      },
    });
    expect(wrapper.exists()).toBe(true);
  });
});
