import StandardForm from '@/arpa_reporter/components/StandardForm.vue';

import { describe, it, expect } from 'vitest';
import { shallowMount } from '@vue/test-utils';

describe('StandardForm component', () => {
  it('renders', () => {
    const wrapper = shallowMount(StandardForm, {
      props: {
        initialRecord: {
          person_name: 'Foo',
        },
        cols: [
          {
            label: 'Person name',
            field: 'person_name',
            readonly: false,
            required: true,
            inputType: 'text',
            selectItems: [
              { label: 'None', value: null },
              { label: 'Bob', value: 'Robert' },
            ],
          },
        ],
      },
    });
    expect(wrapper.exists()).toBe(true);
  });
});
