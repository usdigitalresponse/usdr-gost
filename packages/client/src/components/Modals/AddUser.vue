<template>
  <div>
    <b-modal
      id="add-user-modal"
      ref="modal"
      title="Add User"
      @show="resetModal"
      @hidden="resetModal"
      @ok="handleOk"
      :ok-disabled="$v.formData.$invalid"
    >
      <form ref="form" @submit.stop.prevent="handleSubmit">
        <b-form-group
          :state="!$v.formData.email.$invalid"
          label="Email"
          label-for="email-input"
          invalid-feedback="Required"
        >
          <b-form-input
            id="email-input"
            v-model="formData.email"
            required
          ></b-form-input>
        </b-form-group>
        <b-form-group
          :state="!$v.formData.name.$invalid"
          label="Name"
          label-for="name-input"
          invalid-feedback="Required"
        >
          <b-form-input
            id="name-input"
            v-model="formData.name"
            required
          ></b-form-input>
        </b-form-group>
        <b-form-group
          :state="!$v.formData.role.$invalid"
          label="Role"
          label-for="role-select"
          invalid-feedback="Required"
        >
          <b-form-select
          id="role-select"
          v-model="formData.role" :options="formattedRoles"></b-form-select>
        </b-form-group>
        <b-form-group
          :state="!$v.formData.agency.$invalid"
          label="Agency"
          label-for="agency-select"
          invalid-feedback="Required"
        >
          <b-form-select
          id="agency-select"
          v-model="formData.agency" :options="formattedAgencies"></b-form-select>
        </b-form-group>
      </form>
    </b-modal>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import { required, minLength, email } from 'vuelidate/lib/validators';

export default {
  props: {
    showModal: Boolean,
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
  watch: {
    showModal() {
      this.$bvModal.show('add-user-modal');
    },
  },
  computed: {
    ...mapGetters({
      roles: 'roles/roles',
      agencies: 'agencies/agencies',
    }),
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
    resetModal() {
      this.formData = {};
      this.$emit('update:showModal', false);
    },
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
      await this.createUser(this.formData);
      // Push the name to submitted names
      // Hide the modal manually
      this.$nextTick(() => {
        this.$bvModal.hide('add-user-modal');
      });
    },
  },
};
</script>
