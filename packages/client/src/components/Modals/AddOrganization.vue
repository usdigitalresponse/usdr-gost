<template>
  <div>
    <b-modal
      id="add-tenant-modal"
      ref="modal"
      :title="newTerminologyEnabled ? 'Add Organization' : 'Add Tenant'"
      :ok-disabled="v$.formData.$invalid"
      @show="resetModal"
      @hidden="resetModal"
      @ok="handleOk"
    >
      <form
        ref="form"
        @submit.stop.prevent="handleSubmit"
      >
        <b-form-group
          :state="!v$.formData.tenantName.$invalid"
          :label="newTerminologyEnabled ? 'Organization Name' : 'Tenant Name'"
          label-for="tenantName-input"
          :invalid-feedback="newTerminologyEnabled ? 'Organization name is invalid' : 'Tenant name is invalid'"
        >
          <b-form-input
            id="tenantName-input"
            v-model="formData.tenantName"
            :state="!v$.formData.tenantName.$invalid"
            required
          />
        </b-form-group>
        <b-form-group
          :state="!v$.formData.agencyName.$invalid"
          :label="newTerminologyEnabled ? 'Team Name' : 'Agency Name'"
          label-for="agencyName-input"
          :invalid-feedback="newTerminologyEnabled ? 'Team name is invalid' : 'Agency name is invalid'"
        >
          <b-form-input
            id="agencyName-input"
            v-model="formData.agencyName"
            :state="!v$.formData.agencyName.$invalid"
            required
          />
        </b-form-group>
        <b-form-group
          :state="!v$.formData.agencyAbbreviation"
          :label="newTerminologyEnabled ? 'Team Abbreviation' : 'Agency Abbreviation'"
          label-for="agencyAbbreviation-input"
          :invalid-feedback="newTerminologyEnabled ? 'Team abbreviation is invalid' : 'Agency abbreviation is invalid'"
        >
          <b-form-input
            id="agencyAbbreviation-input"
            v-model="formData.agencyAbbreviation"
            :state="!v$.formData.agencyAbbreviation"
          />
        </b-form-group>
        <b-form-group
          :state="!v$.formData.agencyCode.$invalid"
          label="Agency Code"
          label-for="agencyCode-input"
          invalid-feedback="Agency code is invalid"
        >
          <b-form-input
            id="agencyCode-input"
            v-model="formData.agencyCode"
            :state="!v$.formData.agencyCode.$invalid"
            required
          />
        </b-form-group>
        <b-form-group
          :state="!v$.formData.adminUserEmail.$invalid"
          label="Admin User Email"
          label-for="adminUserEmail-input"
          invalid-feedback="Please enter a valid admin user email address"
        >
          <b-form-input
            id="adminUserEmail-input"
            v-model="formData.adminUserEmail"
            :state="!v$.formData.adminUserEmail.$invalid"
          />
        </b-form-group>
        <b-form-group
          :state="!v$.formData.adminUserName.$invalid"
          label="Admin User Name"
          label-for="adminUserName-input"
          invalid-feedback="Admin user name is invalid"
        >
          <b-form-input
            id="adminUserName-input"
            v-model="formData.adminUserName"
            :state="!v$.formData.adminUserName.$invalid"
          />
        </b-form-group>
      </form>
    </b-modal>
  </div>
</template>

<script>
import { mapActions } from 'vuex';
import { useVuelidate } from '@vuelidate/core';
import { required, email } from '@vuelidate/validators';
import { newTerminologyEnabled } from '@/helpers/featureFlags';

export default {
  props: {
    showModal: Boolean,
  },
  setup() {
    return { v$: useVuelidate() };
  },
  data() {
    return {
      formData: {
        agencyName: null,
        tenantName: null,
        agencyAbbreviation: null,
        agencyCode: null,
        adminUserEmail: null,
        adminUserName: null,
      },
    };
  },
  validations: {
    formData: {
      agencyName: {
        required,
      },
      tenantName: {
        required,
      },
      adminUserEmail: {
        required,
        email,
      },
      agencyCode: {
        required,
      },
      adminUserName: {
        required,
      },
    },
  },
  computed: {
    newTerminologyEnabled() {
      return newTerminologyEnabled();
    },
  },
  watch: {
    modalVisible() {
      // Reset form data when modal is shown
      Object.assign(this.formData, this.$options.data.apply(this).formData);
    },
    showModal() {
      this.$bvModal.show('add-tenant-modal');
    },
  },
  methods: {
    ...mapActions({
      createTenant: 'tenants/createTenant',
    }),
    resetModal() {
      this.formData = {};
      this.$emit('update:showModal', false);
      this.v$.$reset();
    },
    handleOk(bvModalEvt) {
      // Prevent modal from closing
      bvModalEvt.preventDefault();
      // Trigger submit handler
      this.handleSubmit();
    },
    async handleSubmit() {
      // Exit when the form isn't valid
      if (this.v$.formData.$invalid) {
        return;
      }
      await this.createTenant(this.formData);
      // Hide the modal manually
      this.$nextTick(() => {
        this.$bvModal.hide('add-tenant-modal');
      });
    },
  },
};
</script>
