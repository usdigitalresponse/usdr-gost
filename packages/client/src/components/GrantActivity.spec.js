import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import { shallowMount, flushPromises } from '@vue/test-utils';
import { createStore } from 'vuex';
import GrantActivity from '@/components/GrantActivity.vue';

const mockFollowers = {
  followers: Array.from(Array(20), (item, i) => ({
    id: i,
    user: {
      id: i + 100,
      name: `Follower ${i}`,
    },
  })),
};

describe('GrantActivity', () => {
  const mockStore = {
    getters: {
      'users/loggedInUser': () => null,
      'grants/currentGrant': () => ({
        grant_id: 55,
      }),
    },
    actions: {
      'grants/getFollowerForGrant': vi.fn(),
      'grants/getFollowersForGrant': vi.fn(),
      'grants/getNotesForGrant': vi.fn(),
      'grants/followGrantForCurrentUser': vi.fn(),
      'grants/unfollowGrantForCurrentUser': vi.fn(),
    },
  };

  const store = createStore(mockStore);

  beforeEach(() => {
    vi.resetAllMocks();
  });

  const buttonSelector = '[data-follow-btn]';
  const followSummarySelector = '[data-follow-summary]';

  it('renders', () => {
    const wrapper = shallowMount(GrantActivity, {
      global: {
        plugins: [store],
      },
    });
    expect(wrapper.exists()).toBe(true);
  });

  it('Correctly displays followers summary', async () => {
    mockStore.actions['grants/getFollowersForGrant'].mockResolvedValue(mockFollowers);

    const wrapper = shallowMount(GrantActivity, {
      global: {
        plugins: [store],
      },
    });

    await flushPromises();

    const summary = wrapper.find(followSummarySelector);

    expect(summary.text()).equal('Followed by Follower 0 and 19 others');
  });

  it('Correctly follows grants when not followed by user', async () => {
    mockStore.actions['grants/getFollowerForGrant'].mockResolvedValue(null);

    const wrapper = shallowMount(GrantActivity, {
      global: {
        plugins: [store],
      },
    });

    await flushPromises();

    const btn = wrapper.find(buttonSelector);

    expect(btn.text()).equal('Follow');

    btn.trigger('click');
    expect(mockStore.actions['grants/followGrantForCurrentUser']).toHaveBeenCalled();
  });

  it('Correctly unfollows grants when followed by user', async () => {
    mockStore.actions['grants/getFollowerForGrant'].mockResolvedValue({
      id: 1,
    });

    const wrapper = shallowMount(GrantActivity, {
      global: {
        plugins: [store],
      },
    });

    await flushPromises();

    const btn = wrapper.find(buttonSelector);

    expect(btn.text()).equal('Following');

    btn.trigger('click');
    expect(mockStore.actions['grants/unfollowGrantForCurrentUser']).toHaveBeenCalled();
  });
});
