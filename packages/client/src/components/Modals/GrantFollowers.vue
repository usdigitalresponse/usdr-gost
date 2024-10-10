<template>
  <b-modal
    :id="modalId"
    title="Grant Followers"
    footer-class="justify-content-start"
    title-class="h3"
    centered
    scrollable
    @show="handleModalOpen"
    @hidden="$emit('close')"
  >
    <div v-if="!followersLoaded">
      Loading...
    </div>

    <ul class="list-unstyled mt-3">
      <li
        v-for="follower in followers"
        :key="follower.id"
        data-test-follower
        class="mb-3"
      >
        <div class="d-flex">
          <UserActivityItem
            class="mr-3"
            :user-name="follower.user.name"
            :user-email="follower.user.email"
            :team-name="follower.user.team.name"
            :avatar-color="follower.user.avatarColor"
            :created-at="follower.createdAt"
            hide-avatar-vertical
          />
          <CopyButton
            :copy-text="follower.user.email"
            hide-icon
            class="ml-auto flex-shrink-0 mt-1"
          >
            <b-button
              variant="outline-primary"
              size="sm"
            >
              Copy Email
            </b-button>
          </CopyButton>
        </div>
      </li>
    </ul>

    <div
      v-if="loadMoreVisible"
      class="d-flex justify-content-center"
    >
      <b-button
        size="sm"
        variant="link"
        data-test-show-more-btn
        @click="getNextFollowers"
      >
        Load More
      </b-button>
    </div>

    <template #modal-footer>
      <CopyButton
        :copy-text="followersEmailText"
        hide-icon
      >
        <b-button
          variant="outline-primary"
          size="sm"
          :disabled="!followersEmailText"
        >
          Copy All Emails
        </b-button>
      </CopyButton>
    </template>
  </b-modal>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';

import CopyButton from '@/components/CopyButton.vue';
import UserActivityItem from '@/components/UserActivityItem.vue';

export default {
  components: {
    CopyButton,
    UserActivityItem,
  },
  props: {
    modalId: {
      type: String,
      default: undefined,
    },
  },
  emits: ['close'],
  data() {
    return {
      followersLoaded: false,
      followersNextCursor: null,
      loading: false,
      followers: [],
    };
  },
  computed: {
    ...mapGetters({
      currentGrant: 'grants/currentGrant',
    }),
    loadMoreVisible() {
      return this.followersNextCursor !== null;
    },
    followersEmailText() {
      return this.followers
        .map((follower) => follower.user.email)
        .join(', ');
    },
  },
  methods: {
    ...mapActions({
      getFollowersForGrant: 'grants/getFollowersForGrant',
    }),
    handleModalOpen() {
      if (!this.followersLoaded) {
        this.getNextFollowers();
      }
    },
    async getNextFollowers() {
      const query = {
        grantId: this.currentGrant.grant_id,
        limit: 20,
      };

      if (this.followersNextCursor !== null) {
        query.cursor = this.followersNextCursor;
      }
      const result = await this.getFollowersForGrant(query);

      this.followers = this.followers.concat(result.followers);
      this.followersNextCursor = result.pagination.next;
      this.followersLoaded = true;
    },
  },
};
</script>

<style scoped>
.follower-email {
  font-size: 0.8125rem;
}

.follower-email {
  font-weight: 400;
}

.follower-date {
  font-size: 0.75rem;
}

.follower-date:first-letter {
  text-transform: capitalize;
}
</style>
