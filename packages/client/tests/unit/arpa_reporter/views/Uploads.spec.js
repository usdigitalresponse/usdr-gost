import { expect } from 'chai'
import { mount, createLocalVue } from '@vue/test-utils'
import Uploads from '../../../../src/arpa_reporter/views/Uploads.vue'
import Vuex from 'vuex'

const localVue = createLocalVue()
localVue.use(Vuex)

describe('Uploads.vue', () => {
  it('renders', () => {
    const store = new Vuex.Store({
      state: {
        agencies: [],
        allUploads: []
      },
      getters: {
        periodNames: () => ['September, 2020', 'December, 2020'],
        agencyName: () => () => 'Test Agency'
      }
    })

    const wrapper = mount(Uploads, {
      store,
      localVue,
      stubs: ['router-link']
    })
    expect(wrapper.text()).to.include('No uploads')
  })
})

// NOTE: This file was copied from tests/unit/views/Uploads.spec.js (git @ 98c1aa2586) in the arpa-reporter repo on 2022-09-02T05:09:55.179Z
