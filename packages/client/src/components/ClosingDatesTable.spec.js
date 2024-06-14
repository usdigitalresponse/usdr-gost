import ClosingDatesTable from '@/components/ClosingDatesTable.vue';

import {
  describe, it, expect, vi,
} from 'vitest';
import { shallowMount } from '@vue/test-utils';

describe('ClosingDatesTable component', () => {
  it('renders', () => {
    const wrapper = shallowMount(ClosingDatesTable, {
      props: {
        closestGrants: [{
          title: 'foo',
          close_date: new Date(),
        }],
        onRowSelected: vi.fn(),
        onRowClicked: vi.fn(),
      },
    });
    expect(wrapper.exists()).toBe(true);
  });
});
