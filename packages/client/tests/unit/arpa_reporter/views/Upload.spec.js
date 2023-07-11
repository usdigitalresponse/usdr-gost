// import { nextTick } from 'vue';
import { expect } from 'chai';
import { mount, createLocalVue } from '@vue/test-utils';
import moment from 'moment';
import Vuex from 'vuex';
import Upload from '../../../../src/arpa_reporter/views/Upload.vue';

const mocks = {
  $route: {
    path: '/uploads/',
    params: {
      id: '00000000-0000-0000-0000-000000000000',
    },
  },
};

const localVue = createLocalVue();
localVue.use(Vuex);

describe('Upload.vue', () => {
  it('renders with an upload - validated', async () => {
    const store = new Vuex.Store({
      state: {
        reportingPeriods: [{
          id: 43,
          name: 'Quarterly 21',
          start_date: '2026-10-01',
          end_date: '2026-12-31',
          certified_at: null,
          certified_by: null,
          tenant_id: 1,
          template_filename: null,
          certified_by_email: null,
        },
        ],
      },
      mutations: {
        addAlert: () => null,
      },
    });

    const date = new Date('August 19, 2022 23:15:30');
    const upload = {
      filename: 'UPLOAD_CLEAN.xlsm',
      created_at: '2023-06-30T02:09:34.025Z',
      reporting_period_id: 43,
      user_id: 1,
      agency_id: 0,
      validated_at: date.toISOString(), // this is UTC
      validated_by: 1,
      ec_code: '2.32',
      tenant_id: 1,
      id: '00000000-0000-0000-0000-000000000000',
      notes: null,
      invalidated_at: null,
      invalidated_by: null,
      created_by: 'test@usdigitalresponse.org',
      agency_code: 'USDR',
      validated_by_email: null,
    };

    const wrapper = mount(Upload, {
      store,
      localVue,
      stubs: ['router-link'],
      mocks,
    });
    await wrapper.setData({ upload });
    await wrapper.vm.$nextTick();
    const dateStr = moment(date).format('LTS ll');
    expect(wrapper.text()).to.include('Upload 00000000');
    expect(wrapper.text()).to.include(`Validated on ${dateStr}`);
  });

  it('renders with an upload - invalidated', async () => {
    const store = new Vuex.Store({
      state: {
        reportingPeriods: [{
          id: 43,
          name: 'Quarterly 21',
          start_date: '2026-10-01',
          end_date: '2026-12-31',
          certified_at: null,
          certified_by: null,
          tenant_id: 1,
          template_filename: null,
          certified_by_email: null,
        },
        ],
      },
      mutations: {
        addAlert: () => null,
      },
    });

    const date = new Date('August 19, 2022 23:15:30');
    const upload = {
      filename: 'UPLOAD_CLEAN.xlsm',
      created_at: '2023-06-30T02:09:34.025Z',
      reporting_period_id: 43,
      user_id: 1,
      agency_id: 0,
      validated_at: null,
      validated_by: null,
      ec_code: '2.32',
      tenant_id: 1,
      id: '00000000-0000-0000-0000-000000000000',
      notes: null,
      invalidated_at: date, // this is UTC
      invalidated_by: 1,
      created_by: 'test@usdigitalresponse.org',
      agency_code: 'USDR',
      validated_by_email: null,
    };

    const wrapper = mount(Upload, {
      store,
      localVue,
      stubs: ['router-link'],
      mocks,
    });
    await wrapper.setData({ upload });
    await wrapper.vm.$nextTick();
    const dateStr = moment(date).format('LTS ll');
    expect(wrapper.text()).to.include('Upload 00000000');
    expect(wrapper.text()).to.include(`Invalidated on ${dateStr}`);
  });
});
