<template>
    <div>
      <b-alert style="display: flex;" variant="success" show v-model="showBanner" dismissible>
          <b-icon icon="envelope-fill" font-scale="1.5" style="padding-right: 10px;"></b-icon>
          <div style="padding-right: 10px;">
          <b>The Grant ID Tool now has email notifications!</b>
          Fine tune which email you will recieve in Settings or turn on all notifications here:
        </div >
        <b-form-checkbox v-model="checked" name="email-opt-in-switch" switch @change="onUserSubscriptionChangeSubmit"/>
      </b-alert>
      <b-alert
        id="email-settings-banner"
        ref="modal"
        title="Email Settings Banner"
        @show="resetModal"
        @hidden="resetModal"
        ok-only
      >
      </b-alert>
    </div>
  </template>

<script>
import { mapActions, mapGetters } from 'vuex';
// import { required, numeric, minValue } from 'vuelidate/lib/validators';

export default {
  props: {
    showBanner: Boolean,
  },
  data() {
    return {
      checked: true,
    };
  },
  validations: {
    formData: {
    },
  },
  watch: {
    showModal() {
      this.$bvModal.show('profile-settings-modal');
    },
  },
  computed: {
    ...mapGetters({
      loggedInUser: 'users/loggedInUser',
    }),
    agencies() {
      if (!this.loggedInUser) {
        return [];
      }
      return this.loggedInUser.agency.subagencies;
    },
  },
  mounted() {
    if (this.$route.query.manageSettings === 'true') {
      this.$emit('update:showModal', true);
    }
  },
  methods: {
    ...mapActions({
      updateEmailSubscriptionPreferences: 'users/updateEmailSubscriptionPreferences',
    }),
    resetModal() {
      this.$emit('update:showModal', false);
    },
    onUserSubscriptionChangeSubmit(isOptIn) {
      const updatedPreferences = {
        GRANT_ASSIGNMENT: 'UNSUBSCRIBED',
        GRANT_DIGEST: 'UNSUBSCRIBED',
      };
      if (isOptIn) {
        Object.keys(updatedPreferences).forEach((notificationType) => { updatedPreferences[notificationType] = 'SUBSCRIBED'; });
      }
      this.updateEmailSubscriptionPreferences({
        userId: this.loggedInUser.id,
        preferences: updatedPreferences,
      });
    },
  },
};
</script>
