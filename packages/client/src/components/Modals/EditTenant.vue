<!-- eslint-disable max-len -->
<template>
  <div>
    <b-modal
      id="edit-tenant-modal"
      v-model="showDialog"
      ref="modal"
      title="Edit Tenant"
      @hidden="resetModal"
      @ok="handleOk"
    >
    <h3>{{this.tenant && this.tenant.displayName}}</h3>
      <form ref="form" @submit.stop.prevent="handleSubmit">
        <b-form-group
          label-for="name-input"
        >
          <template slot="label">Name</template>
          <b-form-input
              autofocus
              id="name-input"
              type="text"
              min=2
              v-model="formData.displayName"
              required
            ></b-form-input>
        </b-form-group>
      </form>
    </b-modal>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';

export default {
  props: {
    tenant: Object,
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
  computed: {
    ...mapGetters({
    }),
  },
  mounted() {
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
    async handleSubmit() {
      await this.updateDisplayName({ tenantId: this.tenant.id, ...this.formData });
      this.resetModal();
    },
  },
};
</script>
