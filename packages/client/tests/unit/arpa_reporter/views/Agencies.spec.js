import { expect } from 'chai'
import { mount, createLocalVue } from '@vue/test-utils'
import Agencies from '../../../../src/arpa_reporter/views/Agencies.vue'
import Vuex from 'vuex'

const localVue = createLocalVue()
localVue.use(Vuex)

describe('Agencies.vue', () => {
  it('renders project list', () => {
    const store = new Vuex.Store({
      state: {
        allUploads: [],
        agencies: [
          { id: 1, code: '001', name: 'Agency 1' },
          { id: 2, code: '002', name: 'Agency 2' }
        ]
      }
    })
    const wrapper = mount(Agencies, {
      store,
      localVue,
      stubs: ['router-link', 'router-view']
    })
    const r = wrapper.find('tbody')
    expect(r.text()).to.include('Agency 1')
    expect(r.text()).to.include('Agency 2')
  })
})

// NOTE: This file was copied from tests/unit/views/Agencies.spec.js (git @ d124c44d0e) in the arpa-reporter repo on 2022-09-08T23:48:24.330Z
