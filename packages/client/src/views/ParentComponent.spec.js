import { mount, flushPromises } from '@vue/test-utils';
import vSelect from 'vue-select';
import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import ParentComponent from '@/views/ParentComponent.vue';
import ChildComponent from '@/views/ChildComponent.vue';

describe('ParentComponent.vue', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'test'; // avoid any conflict w/ container
  });

  it('selects a child component', async () => {
    const wrapper = mount(ParentComponent, {
      global: {
        components: { ChildComponent }, // Manually register the vue-select component
        stubs: { 'child-component': false }, // Ensure it's not stubbed
      },
    });

    // Ensure everything is rendered before proceeding
    await flushPromises();

    console.log('html:', wrapper.html());
    console.log('text:', wrapper.text());

    // Try to find the vue-select component
    const child = wrapper.findComponent('[data-child-el]');
    const select = wrapper.findComponent(vSelect);

    console.log('Child:', child);
    console.log('Select', select);

    // Verify that child exists in the rendered output
    // expect(select.exists()).toBe(true);
    expect(child.exists()).toBe(true);
  });
});
