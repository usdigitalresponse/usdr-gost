import NotFoundView from '@/views/NotFoundView.vue';

import { describe, it, expect } from 'vitest';
import { shallowMount, createLocalVue } from '@vue/test-utils';
import { BootstrapVue } from 'bootstrap-vue';

describe('NotFoundView', () => {
  const localVue = createLocalVue();
  localVue.use(BootstrapVue);

  it('renders', () => {
    const wrapper = shallowMount(NotFoundView, {
      localVue,
    });
    expect(wrapper.exists()).toBe(true);
  });
});
