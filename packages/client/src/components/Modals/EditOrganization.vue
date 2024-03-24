<!-- eslint-disable max-len -->
<template>
  <div>
    <b-modal
      id="edit-tenant-modal"
      ref="modal"
      v-model="showDialog"
      :title="newTerminologyEnabled ? 'Edit Organization' : 'Edit Tenant'"
      @hidden="resetModal"
      @ok="handleOk"
    >
      <h3>{{ tenant && tenant.displayName }}</h3>
      <form
        ref="form"
        @submit.stop.prevent="handleSubmit"
      >
        <b-form-group
          label-for="name-input"
        >
          <template slot="label">
            Name
          </template>
          <b-form-input
            id="name-input"
            v-model="formData.displayName"
            autofocus
            type="text"
            min="2"
            required
          />
        </b-form-group>
      </form>
    </b-modal>
  </div>
</template>

<script>
import { mapActions } from 'vuex';
import { newTerminologyEnabled } from '@/helpers/featureFlags';

export default {
  props: {
    tenant: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      showDialog: false,
      formData: {
        displayName: null,
      },
    };
  },
  watch: {
    tenant() {
      this.formData.displayName = this.tenant && this.tenant.display_name;
      this.showDialog = Boolean(this.tenant !== null);
    },
  },
  methods: {
    ...mapActions({
      updateDisplayName: 'tenants/updateDisplayName',
    }),
    resetModal() {
      this.$emit('update:tenant', null);
    },
    handleOk(bvModalEvt) {
      bvModalEvt.preventDefault();
      this.handleSubmit();
    },
    newTerminologyEnabled() {
      return newTerminologyEnabled();
    },
    async handleSubmit() {
      await this.updateDisplayName({ tenantId: this.tenant.id, ...this.formData });
      this.resetModal();
    },
  },
};
</script>
