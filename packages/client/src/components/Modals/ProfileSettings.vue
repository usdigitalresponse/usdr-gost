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
      <!--
      <hr />
      <h6>Email Notifications (Coming soon): </h6>
      <b-form-group label="" v-slot="{ ariaDescribedby }">
      <b-form-checkbox-group
        v-model="selected"
        :options="options"
        :aria-describedby="ariaDescribedby"
        switches
        stacked
      ></b-form-checkbox-group>
      </b-form-group>
      -->
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
      selected: [], // Must be an array reference!
      options: [
        { text: 'Grant Assignment', value: 'grant_assigned', disabled: true },
        { text: 'Grant marked as interested or rejected', value: 'grant_interest', disabled: true },
        { text: 'New Grants', value: 'grant_digest', disabled: true },
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
    }),
    resetModal() {
      this.$emit('update:showModal', false);
    },
    onAgencyChangeSubmit(agency) {
      this.changeSelectedAgency(agency.id);
      this.formData.selectedAgency = agency;
    },
  },
};
</script>
