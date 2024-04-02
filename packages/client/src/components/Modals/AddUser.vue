<template>
  <div>
    <b-modal
      id="add-user-modal"
      ref="modal"
      v-model="modalVisible"
      title="Add User"
      :ok-disabled="$v.formData.$invalid"
      @ok="handleOk"
    >
      <form
        ref="form"
        @submit.stop.prevent="handleSubmit"
      >
        <b-form-group
          :state="!$v.formData.email.$invalid"
          label="Email"
          label-for="email-input"
          invalid-feedback="Please enter a valid email address"
        >
          <b-form-input
            id="email-input"
            v-model="formData.email"
            required
          />
        </b-form-group>
        <b-form-group
          :state="!$v.formData.name.$invalid"
          label="Name"
          label-for="name-input"
          invalid-feedback="Please enter your preferred first and last name"
        >
          <b-form-input
            id="name-input"
            v-model="formData.name"
            required
          />
        </b-form-group>
        <b-form-group
          :state="!$v.formData.role.$invalid"
          label="Role"
          label-for="role-select"
          invalid-feedback="Please select your role"
        >
          <b-form-select
            id="role-select"
            v-model="formData.role"
            :options="formattedRoles"
          />
        </b-form-group>
        <b-form-group
          :state="!$v.formData.agency.$invalid"
          :label="newTerminologyEnabled ? 'Team' : 'Agency'"
          label-for="agency-select"
          :invalid-feedback="`Please select your ${newTerminologyEnabled ? 'team' : 'agency'}`"
        >
          <b-form-select
            id="agency-select"
            v-model="formData.agency"
            :options="formattedAgencies"
          />
        </b-form-group>
      </form>
    </b-modal>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import { required, minLength, email } from 'vuelidate/lib/validators';
import { newTerminologyEnabled } from '@/helpers/featureFlags';

export default {
  props: {
    show: Boolean,
  },
  data() {
    return {
      formData: {
        name: null,
        email: null,
        role: null,
        agency: null,
      },
    };
  },
  validations: {
    formData: {
      name: {
        required,
        minLength: minLength(4),
      },
      email: {
        email,
        required,
      },
      role: {
        required,
      },
      agency: {
        required,
      },
    },
  },
  computed: {
    ...mapGetters({
      roles: 'roles/roles',
      agencies: 'agencies/agencies',
    }),
    modalVisible: {
      get() { return this.show; },
      set(value) { this.$emit('update:show', value); },
    },
    formattedRoles() {
      return this.roles.map((role) => ({
        value: role.id,
        text: role.name,
      }));
    },
    formattedAgencies() {
      return this.agencies.map((agency) => ({
        value: agency.id,
        text: agency.name,
      }));
    },
    newTerminologyEnabled() {
      return newTerminologyEnabled();
    },
  },
  watch: {
    showModal() {
      this.$bvModal.show('add-user-modal');
    },
  },
  mounted() {
    if (this.roles.length === 0) {
      this.fetchRoles();
    }
    if (this.agencies.length === 0) {
      this.fetchAgencies();
    }
  },
  methods: {
    ...mapActions({
      createUser: 'users/createUser',
      fetchRoles: 'roles/fetchRoles',
      fetchAgencies: 'agencies/fetchAgencies',
    }),
    handleOk(bvModalEvt) {
      // Prevent modal from closing
      bvModalEvt.preventDefault();
      // Trigger submit handler
      this.handleSubmit();
    },
    async handleSubmit() {
      // Exit when the form isn't valid
      if (this.$v.formData.$invalid) {
        return;
      }
      try {
        await this.createUser(this.formData);
      } catch (error) {
        this.$store.commit('alerts/addAlert', {
          text: `Error adding user: ${error.message}`,
          level: 'err',
        });
      }
      this.modalVisible = false;
    },
  },
};
</script>
