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
        v-for="follower in formattedFollowers"
        :key="follower.id"
        data-test-follower
        class="mb-3"
      >
        <div class="d-flex">
          <UserAvatar
            :user-name="follower.name"
            size="2.5rem"
            :color="follower.avatarColor"
            class="mr-2"
          />
          <div class="follower-details d-flex flex-column has-flexi-truncate mr-2">
            <div
              class="text-truncate"
              :title="follower.nameTeamTitle"
            >
              <span class="font-weight-bold">{{ follower.name }}</span>
              <span class="mx-1">&bull;</span>
              <span class="follower-team text-muted">{{ follower.team }}</span>
            </div>
            <div class="follower-email text-muted">
              {{ follower.email }}
            </div>
            <div class="follower-date text-muted">
              {{ follower.dateFollowedText }}
            </div>
          </div>

          <CopyButton
            :copy-text="follower.email"
            hide-icon
            class="ms-auto flex-shrink-0"
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
          :disabled="!followersLoaded"
        >
          Copy All Emails
        </b-button>
      </CopyButton>
    </template>
  </b-modal>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';

import UserAvatar from '@/components/UserAvatar.vue';
import CopyButton from '@/components/CopyButton.vue';
import { formatActivityDate } from '@/components/GrantNote.vue';

export default {
  components: {
    UserAvatar,
    CopyButton,
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
    formattedFollowers() {
      return this.followers
        .map((follower) => {
          const { user, id, createdAt } = follower;

          return {
            id,
            name: user.name,
            email: user.email,
            team: user.team.name,
            dateFollowedText: formatActivityDate(createdAt),
            nameTeamTitle: `${user.name} \u2022 ${user.team.name}`,
            avatarColor: user.avatarColor,
          };
        });
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
        query.paginateFrom = this.followersNextCursor;
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
.follower-details {
  margin-top: .2rem;
}

.follower-email {
  font-size: 0.8125rem;
}

.follower-team,
.follower-email {
  font-weight: 400;
}

.follower-team,
.follower-date {
  font-size: 0.75rem;
}

.follower-date:first-letter {
  text-transform: capitalize;
}
</style>
