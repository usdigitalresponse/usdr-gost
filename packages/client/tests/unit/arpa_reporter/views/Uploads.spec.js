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

  it('renders with data and defaults to descending sorting', async () => {
    const store = new Vuex.Store({
      state: {
        agencies: [],
        allUploads: [{
          agency_code: 'USDR',
          agency_id: 0,
          created_at: new Date().toISOString(),
          created_by: 'test@usdigitalresponse.org',
          ec_code: '0',
          filename: 'TEST_UPLOAD.xlsm',
          id: '00000000-0000-0000-0000-000000000000',
          notes: null,
          reporting_period_id: 64,
          tenant_id: 1,
          user_id: 1,
          validated_at: new Date().toISOString(),
          validated_by: 1,
        }],
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
    expect(wrapper.text()).to.include('00000000');

    const validatedCol = wrapper.find('#vgt-table').findAll('th').at(6);
    // table sorting doesn't happen until the next tick. this can be found in the
    // good table test cases
    // https://github.com/xaksis/vue-good-table/blob/master/test/unit/specs/Table.spec.js#L78
    await wrapper.vm.$nextTick();
    expect(validatedCol.classes()).to.include('sorting-desc');
    expect(validatedCol.classes()).to.include('sortable');
  });
});

// NOTE: This file was copied from tests/unit/views/Uploads.spec.js (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z
