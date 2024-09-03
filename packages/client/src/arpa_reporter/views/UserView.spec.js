import {
  describe, beforeEach, it, expect,
} from 'vitest';
import { mount } from '@vue/test-utils';
import { createStore } from 'vuex';
import UserView from '@/arpa_reporter/views/UserView.vue';

const mocks = {
  $route: {
    path: '/users/new',
    params: {
      id: 'new',
    },
  },
};

describe('UserView.vue', () => {
  let store;

  beforeEach(() => {
    store = createStore({
      state: {
        agencies: [{ name: 'A1' }, { name: 'A2' }],
      },
      getters: {
        roles: () => [{ name: 'admin' }],
      },
      mutations: {
        addAlert: () => null,
      },
    });
  });
  it('renders new user form', async () => {
    const wrapper = mount(UserView, {
      global: {
        plugins: [store],
        mocks,
      },
    });
    const loading = wrapper.find('div[role="status"]');
    expect(loading.text()).toContain('Loading');

    await wrapper.setData({ user: {} });
    const form = wrapper.find('standardform');
    expect(form.exists()).toBe(true);
  });
});

// NOTE: This file was copied from tests/unit/views/User.spec.js (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z
