<template>
  <div>
    <b-modal
      id="import-agencies-modal"
      ref="modal"
      :title="`Bulk Import ${newTerminologyEnabled ? 'Teams' : 'Agencies'}`"
      @show="resetModal"
      @hidden="resetModal"
      ok-only="true"
    >
      <div>
        <ul>
          <li>Download the bulk import Excel template file by clicking <a href="./agencyImportTemplate.xlsx">here.</a></li>
          <li>Add new {{newTerminologyEnabled ? 'teams' : 'agencies'}} to the Excel file and save it. Make sure that parent {{newTerminologyEnabled ? 'team' : 'agency'}} rows are above all their children {{newTerminologyEnabled ? 'team' : 'agency'}} rows.</li>
          <li>Select your newly edited bulk import file using the <i>Choose File</i> button below, and click <i>Upload</i>.</li>
          <li>When the import is finished, the status of the import, including any errors, will be displayed below.</li>
        </ul>
        <Uploader :uploadRecordType="'agencies'" @importStatus="setStatus" />
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
import { newTerminologyEnabled } from '@/helpers/featureFlags';

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
      this.$bvModal.show('import-agencies-modal');
    },
  },
  computed: {
    newTerminologyEnabled() {
      return newTerminologyEnabled();
    },
  },
  methods: {
    ...mapActions({
      fetchAgencies: 'agencies/fetchAgencies',
    }),
    setStatus(theStatus) {
      const statusObj = theStatus.ret.status;
      const added = `Successful: ${statusObj.agencies.added} ${this.newTerminologyEnabled ? 'teams' : 'agencies'} added`;
      const notAdded = `Unsuccessful: ${statusObj.agencies.errored} ${this.newTerminologyEnabled ? 'teams' : 'agencies'} not added`;
      let errs = '';
      if (statusObj.errors.length > 0) {
        errs = '<ul>';
        // eslint-disable-next-line no-restricted-syntax
        for (const err of statusObj.errors) {
          errs = errs.concat(`<li>${err}</li>`);
        }
        errs = errs.concat('</ul>');
      }
      this.importStatus = `<ul><li>${added}</li><li>${notAdded}</li>${errs}</ul>`;
    },
    resetModal() {
      this.formData = {};
      this.fetchAgencies();
      this.$emit('update:showUploadModal', false);
    },
    async handleSubmit() {
      // Hide the modal manually
      this.$nextTick(() => {
        this.$bvModal.hide('import-agencies-modal');
      });
    },
  },
};
</script>
