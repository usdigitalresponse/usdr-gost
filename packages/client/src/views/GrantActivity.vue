<template>
  <b-card
    header-bg-variant="white"
    footer-bg-variant="white"
  >
    <template #header>
      <h3 class="m-2">
        Grant Activity
      </h3>
    </template>
    <div>
      <div class="feature-text">
        Stay up to date with this grant.
        <b-icon
          v-b-tooltip
          class="ml-2"
          title="Follow this grant to receive an email notification when others follow or leave a note."
          icon="info-circle-fill"
        />
      </div>
      <b-button
        block
        size="lg"
        :variant="followBtnVariant"
        class="mb-4"
        data-follow-btn
        :disabled="loadingFollowState"
        @click="toggleFollowState"
      >
        <span class="h4">
          <b-icon
            icon="check-circle-fill"
            class="mr-2"
          />
        </span>
        <span class="h5">
          {{ followBtnLabel }}
        </span>
      </b-button>
      <div>
        <span
          v-if="showFollowSummary"
          data-follow-summary
        >{{ followSummaryText }}</span>
        <span
          v-if="showFollowSummary && showNotesSummary"
          class="mx-1"
        >&bull;</span>
        <span v-if="showNotesSummary">{{ notesSummaryText }}</span>
      </div>
    </div>

    <template #footer>
      <!-- Feed -->
    </template>
  </b-card>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';

export default {
  components: {},
  data() {
    return {
      userIsFollowing: false,
      loadingFollowState: false,
      followers: [],
      notes: [],
    };
  },
  computed: {
    ...mapGetters({
      loggedInUser: 'users/loggedInUser',
      currentGrant: 'grants/currentGrant',
    }),
    followBtnLabel() {
      return this.userIsFollowing ? 'Following' : 'Follow';
    },
    followBtnVariant() {
      return this.userIsFollowing ? 'success' : 'primary';
    },
    followSummaryText() {
      const userIsFollower = this.followers.some((follower) => follower.user.id === this.loggedInUser?.id);
      const firstFollowerName = userIsFollower ? 'you' : this.followers[0].user.name;

      let otherFollowerText = '';
      if (this.followers.length > 1) {
        const otherFollowersCount = this.followers.length - 1;

        if (otherFollowersCount === 1) {
          otherFollowerText += ' and 1 other';
        } else if (otherFollowersCount < 50) {
          otherFollowerText += ` and ${otherFollowersCount} others`;
        } else if (otherFollowersCount > 50) {
          otherFollowerText += ' and 50+ others';
        }
      }

      return `Followed by ${firstFollowerName}${otherFollowerText}`;
    },
    showFollowSummary() {
      return this.followers.length > 0;
    },
    showNotesSummary() {
      return this.notes.length > 0;
    },
    notesSummaryText() {
      let textCount = `${this.notes.length}`;
      if (this.notes.length > 50) {
        textCount = '50+';
      }

      return `${textCount} notes`;
    },
  },
  async beforeMount() {
    this.fetchFollowState();
    this.fetchFollowersState();
    this.fetchNotes();
  },
  methods: {
    ...mapActions({
      getFollowerForGrant: 'grants/getFollowerForGrant',
      getFollowersForGrant: 'grants/getFollowersForGrant',
      getNotesForGrant: 'grants/getNotesForGrant',
      followGrantForCurrentUser: 'grants/followGrantForCurrentUser',
      unfollowGrantForCurrentUser: 'grants/unfollowGrantForCurrentUser',
    }),
    async fetchFollowState() {
      const result = await this.getFollowerForGrant({ grantId: this.currentGrant.grant_id });
      this.userIsFollowing = Boolean(result);
    },
    async fetchFollowersState() {
      const result = await this.getFollowersForGrant({ grantId: this.currentGrant.grant_id });

      if (result) {
        this.followers = result.followers;
      }
    },
    async fetchNotes() {
      const result = await this.getNotesForGrant({ grantId: this.currentGrant.grant_id });

      if (result) {
        this.notes = result.notes;
      }
    },
    async toggleFollowState() {
      this.loadingFollowState = true;
      if (this.userIsFollowing) {
        await this.unfollowGrantForCurrentUser({ grantId: this.currentGrant.grant_id });
      } else {
        await this.followGrantForCurrentUser({ grantId: this.currentGrant.grant_id });
      }
      this.fetchFollowersState();
      await this.fetchFollowState();
      this.loadingFollowState = false;
    },
  },
};
</script>

<style scoped>
.feature-text {
  margin-bottom: .8rem;
}
</style>
