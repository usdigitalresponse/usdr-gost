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
    <div v-if="loading">
      Loading...
    </div>

    <ul class="list-unstyled">
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
            class="mr-2"
          />
          <div class="d-flex flex-grow-1">
            <div class="follower-details flex-grow-1">
              <div class="d-flex align-items-center">
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
              class="ms-auto"
            >
              <b-button
                variant="outline-primary"
                size="sm"
              >
                Copy Email
              </b-button>
            </CopyButton>
          </div>
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
        >
          Copy All Emails
        </b-button>
      </CopyButton>
    </template>
  </b-modal>
</template>

<script>
import moment from 'moment';
import { mapActions, mapGetters } from 'vuex';

import UserAvatar from '@/components/UserAvatar.vue';
import CopyButton from '@/components/CopyButton.vue';
import { ISO_DATE } from '@/helpers/dates';

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
      followersOffset: 0,
      loading: false,
      loadMoreVisible: false,
      followers: [],
    };
  },
  computed: {
    ...mapGetters({
      currentGrant: 'grants/currentGrant',
    }),
    formattedFollowers() {
      return this.followers
        .map((follower) => {
          const { user, id, createdAt } = follower;
          const createdDate = moment(moment(createdAt).format(ISO_DATE));

          let dateFollowedText = '';
          if (createdDate.isSame(moment(), 'day')) {
            dateFollowedText = 'Today';
          } else if (createdDate.isAfter(moment().subtract(7, 'days'))) {
            const dayCount = moment().diff(createdDate, 'days');
            dateFollowedText = `${dayCount} ${dayCount === 1 ? 'day' : 'days'} ago`;
          } else {
            dateFollowedText = createdDate.format('MMMM D');
          }

          return {
            id,
            name: user.name,
            email: user.email,
            team: user.team.name,
            dateFollowedText,
          };
        });
    },
    followersEmailText() {
      return this.followers
        .map((follower) => follower.user.email)
        .join(',');
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
        offset: this.followersOffset,
        orderBy: 'users.name',
        orderDir: 'asc',
      };
      const result = await this.getFollowersForGrant(query);

      this.followers = this.followers.concat(result.followers);
      this.followersOffset = result.pagination.next;
      this.followersLoaded = true;

      // more to load?
      this.loadMoreVisible = result.pagination.next !== null;
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
</style>
