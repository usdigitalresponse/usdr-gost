import ClosingDatesTable from '@/components/ClosingDatesTable.vue';

import {
  describe, it, expect, vi,
} from 'vitest';
import { shallowMount, createLocalVue } from '@vue/test-utils';
import { BootstrapVue } from 'bootstrap-vue';

describe('ClosingDatesTable component', () => {
  const localVue = createLocalVue();
  localVue.use(BootstrapVue);

  it('renders', () => {
    const wrapper = shallowMount(ClosingDatesTable, {
      propsData: {
        closestGrants: [{
          title: 'foo',
          close_date: new Date(),
        }],
        onRowSelected: vi.fn(),
        onRowClicked: vi.fn(),
      },
      localVue,
    });
    expect(wrapper.exists()).toBe(true);
  });
});
