<template>
    <div>
      <b-alert style="display: flex;  text-align: center; max-width: 1100px;" variant="success" show v-model="showBanner" dismissible>
          <b-icon icon="envelope-fill" font-scale="1.5" style="width: 50px; color: #0FA958;"></b-icon>
          <div style="padding-right: 10px; color: #212529;">
          <b>The Grant ID Tool now has email notifications!</b>
          Fine tune which email you will recieve in <u v-on:click="showProfileSettings()">Settings</u> or turn on all notifications here:
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

export default {
  props: {
    showBanner: Boolean,
    showProfileSettings: Function,
  },
  data() {
    return {
      checked: true,
    };
  },
  computed: {
    ...mapGetters({
      loggedInUser: 'users/loggedInUser',
    }),
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
