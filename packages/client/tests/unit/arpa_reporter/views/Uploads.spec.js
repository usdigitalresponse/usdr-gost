import { expect } from 'chai';
import { mount, createLocalVue } from '@vue/test-utils';
import Vuex from 'vuex';
import Uploads from '../../../../src/arpa_reporter/views/Uploads.vue';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('Uploads.vue', () => {
  it('renders', () => {
    const store = new Vuex.Store({
      state: {
        agencies: [],
        allUploads: [],
      },
      getters: {
        periodNames: () => ['September, 2020', 'December, 2020'],
        agencyName: () => () => 'Test Agency',
      },
    });

    const wrapper = mount(Uploads, {
      store,
      localVue,
      stubs: ['router-link'],
    });
    expect(wrapper.text()).to.include('No uploads');
  });
});

// NOTE: This file was copied from tests/unit/views/Uploads.spec.js (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z
