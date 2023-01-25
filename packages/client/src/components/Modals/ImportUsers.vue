<template>
  <div>
    <b-modal
      id="import-users-modal"
      ref="modal"
      title="Bulk Import Users"
      @show="resetModal"
      @hidden="resetModal"
      ok-only="true"
    >
      <div>
        <ul>
          <li>Download the bulk import Excel template file by clicking <a href="./userImportTemplate.xlsx">here.</a></li>
          <li>Add new users to the Excel file and save it.</li>
          <li>Select your newly edited bulk import file using the <i>Choose File</i> button below, and click <i>Upload</i>.</li>
          <li>When the import is finished, the status of the import, including any errors, will be displayed below.</li>
        </ul>
        <Uploader :uploadRecordType="'users'" @importStatus="setStatus" />
      </div>
      <hr>
      <div>
      <h5>Import Status</h5>
        <div v-html="importStatus"/>
      </div>
    </b-modal>
  </div>
</template>

<script>
import { mapActions } from 'vuex';
import Uploader from '@/components/Uploader.vue';

export default {
  props: {
    showUploadModal: Boolean,
    importStatus: String,
  },
  components: {
    Uploader,
  },
  watch: {
    showUploadModal() {
      this.$bvModal.show('import-users-modal');
    },
  },
  methods: {
    ...mapActions({
      fetchUsers: 'users/fetchUsers',
    }),
    setStatus(theStatus) {
      const statusObj = theStatus.ret.status;
      const added = `Successful: ${statusObj.users.added} users added`;
      const notAdded = `Unsucessful: ${statusObj.users.errored} users not added`;
      let errs = '';
      if (statusObj.errors.length > 0) {
        errs = '<ul>';
        for (const err of statusObj.errors) {
          errs = errs.concat(`<li>${err}</li>`);
        }
        errs = errs.concat('</ul>');
      }
      this.importStatus = `<ul><li>${added}</li><li>${notAdded}</li>${errs}</ul>`;
    },
    resetModal() {
      this.formData = {};
      this.fetchUsers();
      this.$emit('update:showUploadModal', false);
    },
    async handleSubmit() {
      // Hide the modal manually
      this.$nextTick(() => {
        this.$bvModal.hide('import-users-modal');
      });
    },
  },
};
</script>
