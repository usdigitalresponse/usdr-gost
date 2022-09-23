import { expect } from 'chai'
import { mount, createLocalVue } from '@vue/test-utils'
import Home from '../../../../src/arpa_reporter/views/Home.vue'
import Vuex from 'vuex'

const localVue = createLocalVue()
localVue.use(Vuex)

describe('Home.vue', () => {
  it('renders', () => {
    const store = new Vuex.Store({
      state: {
        viewPeriodID: 0
      },
      getters: {
        user: () => ({ email: 'admin@example.com', role: 'admin' }),
        periodNames: () => ['September, 2020', 'December, 2020']
      }
    })
    const wrapper = mount(Home, {
      store,
      localVue,
      stubs: ['router-link', 'router-view']
    })
    const r = wrapper.find('p')
    expect(r.text()).to.include('Welcome')
  })
})

// NOTE: This file was copied from tests/unit/views/Home.spec.js (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z
