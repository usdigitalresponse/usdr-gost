<template>
  <div>
    <b-modal
      id="profile-settings-modal"
      ref="modal"
      title="Profile Settings"
      @show="resetModal"
      @hidden="resetModal"
      ok-only
    >
      <h6>Change Agency: </h6>
      <b-form>
        <v-select :options="agencies" label="name" :value="formData.selectedAgency" @input="onAgencyChangeSubmit">
          <template #search="{attributes, events}">
            <input
              class="vs__search"
              :required="!formData.selectedAgency"
              v-bind="attributes"
              v-on="events"
            />
          </template>
        </v-select>
      </b-form>
      <hr />
      <h6>Email Notifications: </h6>
      <b-form-group label="" v-slot="{ ariaDescribedby }">
      <b-form-checkbox-group
        v-model="selected"
        :options="options"
        :aria-describedby="ariaDescribedby"
        @change="onUserSubscriptionChangeSubmit"
        switches
        stacked
      ></b-form-checkbox-group>
      </b-form-group>
    </b-modal>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
// import { required, numeric, minValue } from 'vuelidate/lib/validators';

export default {
  props: {
    showModal: Boolean,
  },
  data() {
    return {
      selected: [],
      options: [
        { text: 'Grant Assignments', value: 'GRANT_ASSIGNMENT' },
        { text: 'New Grants Digest', value: 'GRANT_DIGEST' },
      ],
      formData: {
        selectedAgency: null,
      },
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
    settingsSelectedAgency() {
      this.formData.selectedAgency = this.settingsSelectedAgency;
    },
  },
  computed: {
    ...mapGetters({
      loggedInUser: 'users/loggedInUser',
      settingsSelectedAgency: 'users/selectedAgency',
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
    this.formData.selectedAgency = this.settingsSelectedAgency;
    this.resetSubscriptionForm(this.formData.selectedAgency);
  },
  methods: {
    ...mapActions({
      changeSelectedAgency: 'users/changeSelectedAgency',
      updateEmailSubscriptionPreferences: 'users/updateEmailSubscriptionPreferences',
    }),
    resetModal() {
      this.$emit('update:showModal', false);
    },
    onUserSubscriptionChangeSubmit(data) {
      const updatedPreferences = {
        GRANT_ASSIGNMENT: 'UNSUBSCRIBED',
        GRANT_DIGEST: 'UNSUBSCRIBED',
      };
      data.forEach((notificationType) => { updatedPreferences[notificationType] = 'SUBSCRIBED'; });
      this.updateEmailSubscriptionPreferences({
        userId: this.loggedInUser.id,
        preferences: updatedPreferences,
      });
    },
    resetSubscriptionForm(agency) {
      let disableEmailPreference;
      if (agency.id === this.loggedInUser.agency.id) {
        disableEmailPreference = false;
        const { emailPreferences } = this.loggedInUser;
        this.selected = Object.keys(emailPreferences).filter((p) => emailPreferences[p] === 'SUBSCRIBED');
      } else {
        disableEmailPreference = true;
        this.selected = [];
      }
      const newOptions = [];
      this.options.forEach((val) => {
        newOptions.push({ ...val, disabled: disableEmailPreference });
      });
      this.options = newOptions;
    },
    onAgencyChangeSubmit(agency) {
      this.changeSelectedAgency(agency.id);
      this.formData.selectedAgency = agency;
      this.resetSubscriptionForm(agency);
    },
  },
};
</script>
