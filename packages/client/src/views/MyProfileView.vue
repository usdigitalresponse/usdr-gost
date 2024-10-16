<template>
  <main>
    <b-breadcrumb :items="breadcrumb_items" />
    <section
      style="max-width: 516px;"
      class="mx-auto my-5 px-2"
    >
      <h2>My Profile</h2>
      <section style="margin-top: 4rem;">
        <b-row>
          <b-col>
            <UserAvatar
              :user-name="loggedInUser.name"
              :color="loggedInUser.avatar_color"
            />
          </b-col>
          <b-col cols="7">
            <p class="mb-2 h6">
              <b>{{ loggedInUser.name }}</b>
            </p>
            <p class="mb-2">
              {{ loggedInUser.email }}
            </p>
            <p class="mb-2">
              {{ loggedInUser.agency_name }}
            </p>
          </b-col>
          <b-col class="text-end">
            <b-button
              variant="primary"
              size="md"
              @click="$bvModal.show('edit-user-modal')"
            >
              <b-icon
                icon="pencil-fill"
                scale="0.8"
              />
              <span class="ml-1">Edit</span>
            </b-button>
          </b-col>
        </b-row>
      </section>
      <section style="margin-top: 3.5rem;">
        <h3 style="margin-bottom: 1.5rem;">
          Email Notifications
        </h3>
        <b-row
          v-for="pref in prefs"
          :key="pref.key"
        >
          <b-col cols="11">
            <p class="mb-0">
              {{ pref.name }}
            </p>
            <p class="pref-description">
              {{ pref.description }}
            </p>
          </b-col>
          <b-col cols="1">
            <b-form-checkbox
              v-model="pref.checked"
              switch
              @change="onUpdateEmailPreference(pref)"
            />
          </b-col>
        </b-row>
      </section>
      <EditUserModal />
    </section>
  </main>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import { shareTerminologyEnabled, followNotesEnabled } from '@/helpers/featureFlags';
import EditUserModal from '@/components/Modals/EditUser.vue';
import UserAvatar from '@/components/UserAvatar.vue';

export default {
  components: {
    EditUserModal,
    UserAvatar,
  },
  data() {
    const shareTerminologyEnabledFlag = shareTerminologyEnabled() === true;
    const followNotesEnabledFlag = followNotesEnabled() === true;
    const grantAssignmentDescription = 'Send me notifications if a grant has been assigned to my USDR Grants team.';
    const grantShareDescription = 'Send me an email notification when someone shares a grant with my team.';

    return {
      prefs: [
        {
          name: 'New Grant Digest',
          key: 'GRANT_DIGEST',
          description: 'Send me a daily email if new grants match my saved search(es).',
        },
        {
          name: shareTerminologyEnabledFlag ? 'Shared Grants' : 'Grants Assignment',
          key: 'GRANT_ASSIGNMENT',
          description: shareTerminologyEnabledFlag ? grantShareDescription : grantAssignmentDescription,
        },
        ...(followNotesEnabledFlag ? [{
          name: 'Grant Activity',
          key: 'GRANT_ACTIVITY',
          description: 'Send me a daily summary of new activity for grants that I follow.',
        }] : []),
      ],
      breadcrumb_items: [
        {
          text: 'Home',
          to: 'grants',
        },
        {
          text: 'My Profile',
          href: '#',
        },
      ],
    };
  },
  computed: {
    ...mapGetters({
      loggedInUser: 'users/loggedInUser',
    }),
  },
  beforeMount() {
    this.prefs.forEach((pref) => {
      // eslint-disable-next-line no-param-reassign
      pref.checked = this.loggedInUser.emailPreferences[pref.key] === 'SUBSCRIBED';
    });
  },
  methods: {
    ...mapActions({
      updateEmailSubscriptionPreferences: 'users/updateEmailSubscriptionPreferencesForLoggedInUser',
    }),
    onUpdateEmailPreference(pref) {
      const updatedPreferences = {
        ...this.loggedInUser.emailPreferences,
        [pref.key]: pref.checked ? 'SUBSCRIBED' : 'UNSUBSCRIBED',
      };
      this.updateEmailSubscriptionPreferences({
        preferences: updatedPreferences,
      });
    },
  },
};
</script>
<style>
  .pref-description {
    font-size: 12px;
    margin-bottom: 2rem;
  }
  .breadcrumb {
    background-color: #ffffff;
  }
</style>
