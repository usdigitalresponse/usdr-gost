import CopyButton from '@/components/CopyButton.vue';

import { describe, it, expect } from 'vitest';
import { shallowMount, createLocalVue } from '@vue/test-utils';
import { BootstrapVue, BootstrapVueIcons } from 'bootstrap-vue';

describe('CopyButton component', () => {
  const localVue = createLocalVue();
  localVue.use(BootstrapVue);
  localVue.use(BootstrapVueIcons);

  it('renders', () => {
    const wrapper = shallowMount(CopyButton, {
      propsData: {
        copyText: 'foo',
      },
      localVue,
    });
    expect(wrapper.exists()).toBe(true);
  });
});
