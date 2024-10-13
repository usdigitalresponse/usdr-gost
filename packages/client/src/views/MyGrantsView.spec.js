import MyGrantsView from '@/views/MyGrantsView.vue';

import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { createStore } from 'vuex';
import { shareTerminologyEnabled, followNotesEnabled } from '@/helpers/featureFlags';
import GrantsTable from '@/components/GrantsTable.vue';

vi.mock('bootstrap-vue', async () => ({
  // SavedSearchPanel imports bootstrap-vue, which triggers an error in testing, so we'll mock it out
  VBToggle: vi.fn(),
}));

vi.mock('@/helpers/featureFlags', async (importOriginal) => ({
  ...await importOriginal(),
  shareTerminologyEnabled: vi.fn(),
  followNotesEnabled: vi.fn(),
}));

describe('MyGrantsView.vue', () => {
  describe('when follow notes flag is off', () => {
    const store = createStore({
      getters: {
        'users/selectedAgencyId': () => '123',
      },
    });
    const $route = {
      params: {
        tab: 'applied',
      },
      meta: {
        tabNames: ['interested', 'applied'],
      },
    };

    beforeEach(() => {
      vi.mocked(shareTerminologyEnabled).mockReturnValue(true);
      vi.mocked(followNotesEnabled).mockReturnValue(false);
    });

    it('renders', () => {
      const wrapper = shallowMount(MyGrantsView, {
        global: {
          plugins: [store],
          mocks: {
            $route,
          },
        },
      });
      expect(wrapper.exists()).toBe(true);

      // check tab titles
      const html = wrapper.html();
      expect(html).toContain('title="Shared With Your Team"');
      expect(html).toContain('title="Interested"');
      expect(html).toContain('title="Not Applying"');
      expect(html).toContain('title="Applied"');
      expect(html).not.toContain('title="Shared With My Team"');
      expect(html).not.toContain('title="Followed by My Team"');

      // check tab order and table search title props
      const tabs = wrapper.findAllComponents(GrantsTable);
      expect(tabs.length).toEqual(4);
      expect(tabs[0].props().searchTitle).toEqual('Shared With Your Team');
      expect(tabs[1].props().searchTitle).toEqual('Interested');
      expect(tabs[2].props().searchTitle).toEqual('Not Applying');
      expect(tabs[3].props().searchTitle).toEqual('Applied');
    });
  });

  describe('when follow notes flag is on', () => {
    const store = createStore({
      getters: {
        'users/selectedAgencyId': () => '123',
      },
    });
    const $route = {
      // @todo: adjust these for new tab names?
      params: {
        tab: 'applied',
      },
      meta: {
        tabNames: ['interested', 'applied'],
      },
    };

    beforeEach(() => {
      vi.mocked(shareTerminologyEnabled).mockReturnValue(true);
      vi.mocked(followNotesEnabled).mockReturnValue(true);
    });

    it('renders', () => {
      const wrapper = shallowMount(MyGrantsView, {
        global: {
          plugins: [store],
          mocks: {
            $route,
          },
        },
      });
      expect(wrapper.exists()).toBe(true);

      // check tab titles
      const html = wrapper.html();
      expect(html).toContain('title="Shared With My Team"');
      expect(html).toContain('title="Followed by My Team"');
      expect(html).not.toContain('title="Shared With Your Team"');
      expect(html).not.toContain('title="Interested"');
      expect(html).not.toContain('title="Not Applying"');
      expect(html).not.toContain('title="Applied"');

      // check tab order and table search title props
      const tabs = wrapper.findAllComponents(GrantsTable);
      expect(tabs.length).toEqual(2);
      expect(tabs[0].props().searchTitle).toEqual('Shared With My Team');
      expect(tabs[1].props().searchTitle).toEqual('Followed by My Team');
    });
  });
});
