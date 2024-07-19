import {
  describe, it, expect, vi,
} from 'vitest';
import { mount } from '@vue/test-utils';
import { createStore } from 'vuex';
import AgenciesView from '@/arpa_reporter/views/AgenciesView.vue';

describe('AgenciesView.vue', () => {
  it('renders project list', () => {
    const store = createStore({
      state: {
        allUploads: [],
        agencies: [
          { id: 1, code: '001', name: 'Agency 1' },
          { id: 2, code: '002', name: 'Agency 2' },
        ],
      },
      actions: {
        updateAgencies: vi.fn(),
      },
    });
    const wrapper = mount(AgenciesView, {
      global: {
        plugins: [store],
        stubs: ['router-link', 'router-view'],
      },
    });
    const r = wrapper.find('tbody');
    expect(r.text()).toContain('Agency 1');
    expect(r.text()).toContain('Agency 2');
  });
});

// NOTE: This file was copied from tests/unit/views/Agencies.spec.js (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z
