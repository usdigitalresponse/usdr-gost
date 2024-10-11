import {
  describe, it, beforeEach, expect, vi,
} from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { createStore } from 'vuex';
import MyProfileView from '@/views/MyProfileView.vue';
import { shareTerminologyEnabled, followNotesEnabled } from '@/helpers/featureFlags';

describe('MyProfileView.vue', () => {
  const store = createStore({
    getters: {
      'users/loggedInUser': () => ({
        emailPreferences: {
          GRANT_ASSIGNMENT: 'SUBSCRIBED',
          GRANT_INTEREST: 'SUBSCRIBED',
          GRANT_DIGEST: 'SUBSCRIBED',
          GRANT_FINDER_UPDATES: 'SUBSCRIBED',
          GRANT_ACTIVITY: 'SUBSCRIBED',
        },
      }),
    },
  });

  vi.mock('@/helpers/featureFlags', async (importOriginal) => ({
    ...await importOriginal(),
    shareTerminologyEnabled: vi.fn(),
    followNotesEnabled: vi.fn(),
  }));

  describe('when share terminology flag is off', () => {
    beforeEach(() => {
      vi.mocked(shareTerminologyEnabled).mockReturnValue(false);
    });

    it('should show assign terminology', () => {
      const wrapper = shallowMount(MyProfileView, {
        global: {
          plugins: [store],
        },
      });
      const text = wrapper.text();
      expect(text).toContain('Grants Assignment');
      expect(text).toContain(
        'Send me notifications if a grant has been assigned to my USDR Grants team.',
      );
    });
  });

  describe('when share terminology flag is on', () => {
    beforeEach(() => {
      vi.mocked(shareTerminologyEnabled).mockReturnValue(true);
    });

    it('should show share terminology', () => {
      const wrapper = shallowMount(MyProfileView, {
        global: {
          plugins: [store],
        },
      });
      const text = wrapper.text();
      expect(text).toContain('Shared Grants');
      expect(text).toContain(
        'Send me an email notification when someone shares a grant with my team.',
      );
    });
  });

  describe('when follow notes flag is off', () => {
    beforeEach(() => {
      vi.mocked(followNotesEnabled).mockReturnValue(false);
    });

    it('should not show grant activity preference', () => {
      const wrapper = shallowMount(MyProfileView, {
        global: {
          plugins: [store],
        },
      });
      const text = wrapper.text();
      expect(text).not.toContain('Grant Activity');
      expect(text).not.toContain(
        'Send me a daily summary of new activity for grants that I follow.',
      );
    });
  });

  describe('when follow notes flag is on', () => {
    beforeEach(() => {
      vi.mocked(followNotesEnabled).mockReturnValue(true);
    });

    it('should show grant activity preference', () => {
      const wrapper = shallowMount(MyProfileView, {
        global: {
          plugins: [store],
        },
      });
      const text = wrapper.text();
      expect(text).toContain('Grant Activity');
      expect(text).toContain(
        'Send me a daily summary of new activity for grants that I follow.',
      );
    });
  });
});
