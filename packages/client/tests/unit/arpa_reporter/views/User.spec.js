import { expect } from 'chai'
import { mount, createLocalVue } from '@vue/test-utils'
import User from '../../../../src/arpa_reporter/views/User.vue'
import Vuex from 'vuex'

const localVue = createLocalVue()
localVue.use(Vuex)

const mocks = {
  $route: {
    path: '/users/new',
    params: {
      id: 'new'
    }
  }
}

describe('User.vue', () => {
  let store

  beforeEach(() => {
    store = new Vuex.Store({
      state: {
        agencies: [{ name: 'A1' }, { name: 'A2' }]
      },
      getters: {
        roles: () => [{ name: 'admin' }]
      },
      mutations: {
        addAlert: () => null
      }
    })
  })
  it('renders new user form', async () => {
    const wrapper = mount(User, { store, localVue, mocks })
    const loading = wrapper.find('div[role="status"]')
    expect(loading.text()).to.include('Loading')

    await wrapper.setData({ user: {} })
    const form = wrapper.findComponent({ name: 'StandardForm' })
    expect(form.exists()).to.equal(true)
  })
})

// NOTE: This file was copied from tests/unit/views/User.spec.js (git @ d124c44d0e) in the arpa-reporter repo on 2022-09-08T23:48:24.330Z
