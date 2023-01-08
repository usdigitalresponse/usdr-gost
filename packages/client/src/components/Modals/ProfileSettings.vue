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
      <h6>Email Notifications (Coming soon): </h6>
      <b-form-group label="" v-slot="{ ariaDescribedby }">
      <b-form-checkbox-group
        v-model="selected"
        :options="options"
        :aria-describedby="ariaDescribedby"
        @change="onAgencySubscriptionChangeSubmit"
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
    const sample = {
      GRANT_ASSIGNMENT: Math.floor(Math.random() * 100) / 2 === 0 ? 'UNSUBSCRIBED' : 'SUBSCRIBED',
      GRANT_DIGEST: Math.floor(Math.random() * 100) / 2 === 0 ? 'SUBSCRIBED' : 'UNSUBSCRIBED',
    };
    console.log(sample);
    const emailPreferences = this.formData?.selectedAgency?.preferences || sample;
    const subscribed = Object.keys(emailPreferences).filter((p) => emailPreferences[p] === 'SUBSCRIBED');
    return {
      selected: subscribed,
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
    this.formData.selectedAgency = this.settingsSelectedAgency;
  },
  methods: {
    ...mapActions({
      changeSelectedAgency: 'users/changeSelectedAgency',
      updateAgencyEmailSubscriptionPreferences: 'agencies/updateAgencyEmailSubscriptionPreferences',
    }),
    resetModal() {
      this.$emit('update:showModal', false);
    },
    onAgencySubscriptionChangeSubmit(data) {
      const updatedPreferences = {};
      data.forEach((notificationType) => { updatedPreferences[notificationType] = 'SUBSCRIBED'; });
      this.updateAgencyEmailSubscriptionPreferences({
        agencyId: this.formData.selectedAgency.id,
        preferences: updatedPreferences,
      });
    },
    onAgencyChangeSubmit(agency) {
      this.changeSelectedAgency(agency.id);
      this.formData.selectedAgency = agency;
    },
  },
};
</script>
