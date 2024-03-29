<template>
  <div>
    <b-modal
      id="import-agencies-modal"
      ref="modal"
      :title="`Bulk Import ${newTerminologyEnabled ? 'Teams' : 'Agencies'}`"
      ok-only="true"
      @show="resetModal"
      @hidden="resetModal"
    >
      <div>
        <ul>
          <li>Download the bulk import Excel template file by clicking <a href="./agencyImportTemplate.xlsx">here.</a></li>
          <li>Add new {{ newTerminologyEnabled ? 'teams' : 'agencies' }} to the Excel file and save it. Make sure that parent {{ newTerminologyEnabled ? 'team' : 'agency' }} rows are above all their children {{ newTerminologyEnabled ? 'team' : 'agency' }} rows.</li>
          <li>Select your newly edited bulk import file using the <i>Choose File</i> button below, and click <i>Upload</i>.</li>
          <li>When the import is finished, the status of the import, including any errors, will be displayed below.</li>
        </ul>
        <Uploader
          :upload-record-type="'agencies'"
          @importStatus="setStatus"
        />
      </div>
      <hr>
      <div>
        <h5>Import Status</h5>
        <div v-if="importResult">
          <ul>
            <li>{{ importResult.added }}</li>
            <li>{{ importResult.notAdded }}</li>
            <li
              v-for="error in importResult.errors"
              :key="error"
            >
              {{ error }}
            </li>
          </ul>
        </div>
        <div v-else>
          Nothing imported yet.
        </div>
      </div>
    </b-modal>
  </div>
</template>

<script>
import { mapActions } from 'vuex';
import Uploader from '@/components/Uploader.vue';
import { newTerminologyEnabled } from '@/helpers/featureFlags';

export default {
  components: {
    Uploader,
  },
  props: {
    showUploadModal: Boolean,
  },
  data() {
    return {
      importResult: null,
    };
  },
  computed: {
    newTerminologyEnabled() {
      return newTerminologyEnabled();
    },
  },
  watch: {
    showUploadModal() {
      this.$bvModal.show('import-agencies-modal');
    },
  },
  methods: {
    ...mapActions({
      fetchAgencies: 'agencies/fetchAgencies',
    }),
    setStatus(status) {
      const { agencies, errors } = status.ret.status;
      this.importResult = {
        added: `Successful: ${agencies.added} ${this.newTerminologyEnabled ? 'teams' : 'agencies'} added`,
        notAdded: `Unsuccessful: ${agencies.errored} ${this.newTerminologyEnabled ? 'teams' : 'agencies'} not added`,
        errors,
      };
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
