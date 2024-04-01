import { expect } from 'chai';
import { mount, createLocalVue } from '@vue/test-utils';
import Vuex from 'vuex';
import UserView from '@/arpa_reporter/views/UserView.vue';

const localVue = createLocalVue();
localVue.use(Vuex);

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
    store = new Vuex.Store({
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
    const wrapper = mount(UserView, { store, localVue, mocks });
    const loading = wrapper.find('div[role="status"]');
    expect(loading.text()).to.include('Loading');

    await wrapper.setData({ user: {} });
    const form = wrapper.findComponent({ name: 'StandardForm' });
    expect(form.exists()).to.equal(true);
  });
});

// NOTE: This file was copied from tests/unit/views/User.spec.js (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z
