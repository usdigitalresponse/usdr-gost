import {
  describe, it, beforeEach, expect, vi,
} from 'vitest';
import { createLocalVue, shallowMount } from '@vue/test-utils';
import Vuex from 'vuex';
import MyProfileView from '@/views/MyProfileView.vue';
import { shareTerminologyEnabled } from '@/helpers/featureFlags';
import { BootstrapVue, BootstrapVueIcons } from 'bootstrap-vue';

describe('MyProfileView.vue', () => {
  const localVue = createLocalVue();
  localVue.use(Vuex);
  localVue.use(BootstrapVue);
  localVue.use(BootstrapVueIcons);
  const store = new Vuex.Store({
    getters: {
      'users/loggedInUser': () => ({
        emailPreferences: {
          GRANT_ASSIGNMENT: 'SUBSCRIBED',
          GRANT_INTEREST: 'SUBSCRIBED',
          GRANT_DIGEST: 'SUBSCRIBED',
          GRANT_FINDER_UPDATES: 'SUBSCRIBED',
        },
      }),
    },
  });

  vi.mock('@/helpers/featureFlags', async (importOriginal) => ({
    ...await importOriginal(),
    shareTerminologyEnabled: vi.fn(),
  }));

  describe('when share terminology flag is off', () => {
    beforeEach(() => {
      vi.mocked(shareTerminologyEnabled).mockReturnValue(false);
    });

    it('should show assign terminology', () => {
      const wrapper = shallowMount(MyProfileView, { store, localVue });
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
      const wrapper = shallowMount(MyProfileView, { store, localVue });
      const text = wrapper.text();
      expect(text).toContain('Shared Grants');
      expect(text).toContain(
        'Send me an email notification when someone shares a grant with my team.',
      );
    });
  });
});
