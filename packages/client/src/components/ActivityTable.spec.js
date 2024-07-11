import {
  beforeEach, describe, it, expect,
} from 'vitest';
import { createLocalVue, mount } from '@vue/test-utils';
import { BootstrapVue } from 'bootstrap-vue';
import ActivityTable from '@/components/ActivityTable.vue';

let wrapper;
const stubs = ['b-icon'];
const localVue = createLocalVue();
localVue.use(BootstrapVue);

describe('ActivityTable.vue', () => {
  describe('when view is loaded', () => {
    beforeEach(() => {
      wrapper = mount(ActivityTable, {
        localVue,
        stubs,
        propsData: {
          grantsInterested: [],
          onRowSelected: () => {},
          onRowClicked: () => {},
        },
      });
    });

    it('displays information about interested grants', async () => {
      await wrapper.setProps({
        grantsInterested: [{
          created_at: '2024-06-16T00:00:00.000Z', name: 'USDR', status_code: 'Rejected', interested_name: 'Will Apply', agency_id: 0, title: 'Rejected Grant', grant_id: '666997', assigned_by: null, assigned_by_user_name: null,
        }, {
          created_at: '2024-06-15T00:00:00.000Z', name: 'USDR', status_code: 'Interested', interested_name: 'Will Apply', agency_id: 0, title: 'Test Grant 666999', grant_id: '666999', assigned_by: null, assigned_by_user_name: null,
        }, {
          created_at: '2024-06-20T00:00:00.000Z', name: 'USDR', status_code: null, interested_name: null, agency_id: 0, title: 'EAR Postdoctoral Fellowships', grant_id: '333334', assigned_by: 17, assigned_by_user_name: 'USDR Staff',
        }],
      });

      const text = wrapper.text();
      expect(text).toContain('USDR  rejected Rejected Grant');
      expect(text).toContain('USDR  is  interested  in Test Grant 666999');
      expect(text).toContain('USDR Staff shared  EAR Postdoctoral Fellowships with USDR');
    });
  });
});
