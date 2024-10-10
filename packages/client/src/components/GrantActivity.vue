<template>
  <div>
    <b-card
      header-bg-variant="white"
      footer-bg-variant="white"
      footer-class="p-0"
    >
      <template #header>
        <h3 class="my-2">
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
          data-follow-btn
          :disabled="!userFollowStateLoaded"
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
        <div
          v-if="grantHasFollowers || showNotesSummary"
          class="mt-4"
        >
          <b-link
            v-if="grantHasFollowers"
            data-follow-summary
            @click="$bvModal.show('grant-followers-modal')"
          >
            {{ followSummaryText }}
          </b-link>
          <span
            v-if="grantHasFollowers && showNotesSummary"
            class="mx-1"
          >&bull;</span>
          <span v-if="showNotesSummary">{{ notesSummaryText }}</span>
        </div>
      </div>

      <template #footer>
        <!-- Feed -->
        <GrantNotes @noteSaved="fetchFollowAndNotes" />
      </template>
    </b-card>

    <!-- Modals -->
    <GrantFollowersModal
      :key="grantFollowersModalKey"
      modal-id="grant-followers-modal"
      @close="handleModalClose"
    />
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import GrantNotes from '@/components/GrantNotes.vue';
import GrantFollowersModal from '@/components/Modals/GrantFollowers.vue';

export default {
  components: {
    GrantNotes,
    GrantFollowersModal,
  },
  data() {
    return {
      userIsFollowing: false,
      userFollowStateLoaded: false,
      followers: [],
      notes: [],
      grantFollowersModalKey: 0,
    };
  },
  computed: {
    ...mapGetters({
      currentGrant: 'grants/currentGrant',
    }),
    followBtnLabel() {
      return this.userIsFollowing ? 'Following' : 'Follow';
    },
    followBtnVariant() {
      return this.userIsFollowing ? 'success' : 'primary';
    },
    followSummaryText() {
      const userIsFollower = this.userIsFollowing;
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
    grantHasFollowers() {
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

      return `${textCount} ${this.notes.length === 1 ? 'note' : 'notes'}`;
    },
  },
  async beforeMount() {
    this.fetchFollowAndNotes();
  },
  methods: {
    ...mapActions({
      getFollowerForGrant: 'grants/getFollowerForGrant',
      getFollowersForGrant: 'grants/getFollowersForGrant',
      getNotesForGrant: 'grants/getNotesForGrant',
      followGrantForCurrentUser: 'grants/followGrantForCurrentUser',
      unfollowGrantForCurrentUser: 'grants/unfollowGrantForCurrentUser',
    }),
    fetchFollowAndNotes() {
      this.fetchAllFollowState();
      this.fetchAllNotes();
    },
    async fetchAllFollowState() {
      const [userResult, followersResult] = await Promise.all([
        this.fetchUserFollowState(),
        this.fetchAllFollowersState(),
      ]);

      this.setFollowState({ user: userResult, followers: followersResult });
    },
    async fetchUserFollowState() {
      const userResult = await this.getFollowerForGrant({ grantId: this.currentGrant.grant_id });
      this.userFollowStateLoaded = true;
      return userResult;
    },
    async fetchAllFollowersState() {
      const followers = await this.getFollowersForGrant({ grantId: this.currentGrant.grant_id, limit: 51 });
      return followers;
    },
    setFollowState({ user, followers }) {
      this.userIsFollowing = Boolean(user);
      this.followers = (followers?.followers || []);
    },
    async fetchAllNotes() {
      const result = await this.getNotesForGrant({ grantId: this.currentGrant.grant_id, limit: 51 });

      if (result) {
        this.notes = result.notes;
      }
    },
    async toggleFollowState() {
      this.userFollowStateLoaded = false;
      try {
        if (this.userIsFollowing) {
          await this.unfollowGrantForCurrentUser({ grantId: this.currentGrant.grant_id });
        } else {
          await this.followGrantForCurrentUser({ grantId: this.currentGrant.grant_id });
        }

        const followers = await this.fetchAllFollowersState();
        this.setFollowState({ user: !this.userIsFollowing, followers });
      } catch (e) {
        // Error is logged already, catch to allow recovery
      }

      this.userFollowStateLoaded = true;
    },
    handleModalClose() {
      // Reset modal
      this.grantFollowersModalKey += 1;
    },
  },
};
</script>

<style scoped>
.feature-text {
  margin-bottom: .8rem;
}
</style>
