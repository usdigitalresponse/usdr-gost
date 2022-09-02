import { expect } from 'chai'
import { shallowMount, createLocalVue } from '@vue/test-utils'
import Navigation from '../../../../src/arpa_reporter/components/Navigation.vue'
import Vuex from 'vuex'

const localVue = createLocalVue()
localVue.use(Vuex)

describe('Navigation.vue', () => {
  let store
  let $route
  beforeEach(() => {
    store = new Vuex.Store({
      getters: {
        periodNames: () => ['September, 2020', 'December, 2020'],
        viewPeriod: () => ({ id: 1 }),
        user: () => ({ email: 'user@example.com', role: 'admin' }),
        applicationTitle: () => 'ARPA Reporter',
        agencyName: () => id => `Agency ${id}`
      }
    })
    $route = { path: '/' }
  })

  it('renders the nav element', () => {
    const wrapper = shallowMount(Navigation, {
      store,
      localVue,
      stubs: ['router-link', 'router-view'],
      mocks: { $route }
    })
    const navbars = wrapper.findAll('nav.navbar')
    expect(navbars.length).to.equal(1) // has one navbar element

    const navs = wrapper.findAll('ul.nav')
    expect(navs.length).to.equal(1) // has one nav element
  })

  it('include title', () => {
    const wrapper = shallowMount(Navigation, {
      store,
      localVue,
      stubs: ['router-link', 'router-view'],
      mocks: { $route }
    })
    const r = wrapper.find('a.navbar-brand')
    expect(r.text()).to.include('ARPA Reporter')
  })
})

// NOTE: This file was copied from tests/unit/components/Navigation.spec.js (git @ 98c1aa2586) in the arpa-reporter repo on 2022-09-02T05:09:55.179Z
// manual modify in dev branch

