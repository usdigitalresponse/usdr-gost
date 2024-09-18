import {
  describe, beforeEach, it, expect, vi,
} from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createStore } from 'vuex';
import GrantFollowers from '@/components/Modals/GrantFollowers.vue';

const mockStore = {
  getters: {
    'grants/currentGrant': () => ({
      grant_id: 55,
    }),
  },
  actions: {
    'grants/getFollowersForGrant': vi.fn(),
  },
};

const store = createStore(mockStore);

const getMockFollowers = (count, hasMoreCursor = null) => ({
  followers: Array.from(Array(count), () => ({
    id: Math.random(),
    user: {
      id: Math.random(),
      name: 'Follower',
      email: 'name@email',
      team: {
        name: 'Team',
      },
    },
  })),
  pagination: {
    next: hasMoreCursor,
  },
});

let wrapper;

beforeEach(() => {
  wrapper = mount(GrantFollowers, {
    global: {
      plugins: [store],
    },
    props: {
      modalId: 'followers-modal',
    },
  });
});

describe('GrantFollowers.vue', () => {
  it('should fetch the followers when loaded', async () => {
    mockStore.actions['grants/getFollowersForGrant'].mockResolvedValue(getMockFollowers(20));

    const modal = wrapper.findComponent({ name: 'b-modal' });
    modal.trigger('show');

    await flushPromises();

    const followers = wrapper.findAll('[data-test-follower]');

    expect(followers).toHaveLength(20);
  });

  it('should load re-fetch followers when user clicks Show More', async () => {
    // Mock first batch of records
    mockStore.actions['grants/getFollowersForGrant'].mockResolvedValue(getMockFollowers(20, 'id-x'));

    const modal = wrapper.findComponent({ name: 'b-modal' });
    modal.trigger('show');

    await flushPromises();
    expect(mockStore.actions['grants/getFollowersForGrant'].mock.lastCall[1].paginateFrom).toBeUndefined();

    const showMoreBtn = wrapper.findComponent('[data-test-show-more-btn]');

    // Mock second batch of records
    mockStore.actions['grants/getFollowersForGrant'].mockResolvedValue(getMockFollowers(20));

    showMoreBtn.trigger('click');

    await flushPromises();
    expect(mockStore.actions['grants/getFollowersForGrant'].mock.lastCall[1].paginateFrom).to.equal('id-x');

    const followers = wrapper.findAll('[data-test-follower]');

    expect(followers).toHaveLength(40);
    expect(wrapper.findComponent('[data-test-show-more-btn]').exists()).to.equal(false);
  });
});
