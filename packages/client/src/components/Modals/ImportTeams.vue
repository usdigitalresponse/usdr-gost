<template>
  <div>
    <b-modal
      id="import-agencies-modal"
      ref="modal"
      v-model="modalVisible"
      :title="`Bulk Import ${newTerminologyEnabled ? 'Teams' : 'Agencies'}`"
      ok-only="true"
    >
      <div>
        <ul>
          <li>Download the bulk import Excel template file by clicking <a href="./agencyImportTemplate.xlsx">here.</a></li>
          <li>Add new {{ newTerminologyEnabled ? 'teams' : 'agencies' }} to the Excel file and save it. Make sure that parent {{ newTerminologyEnabled ? 'team' : 'agency' }} rows are above all their children {{ newTerminologyEnabled ? 'team' : 'agency' }} rows.</li>
          <li>Select your newly edited bulk import file using the <i>Choose File</i> button below, and click <i>Upload</i>.</li>
          <li>When the import is finished, the status of the import, including any errors, will be displayed below.</li>
        </ul>
        <RecordUploader
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
import RecordUploader from '@/components/RecordUploader.vue';
import { newTerminologyEnabled } from '@/helpers/featureFlags';

export default {
  components: {
    RecordUploader,
  },
  props: {
    show: Boolean,
  },
  data() {
    return {
      importResult: null,
    };
  },
  computed: {
    modalVisible: {
      get() { return this.show; },
      set(value) {
        if (!value) {
          // Reset result and refetch teams when closing
          this.importResult = null;
          this.fetchAgencies();
        }
        this.$emit('update:show', value);
      },
    },
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
    async handleSubmit() {
      // Hide the modal manually
      this.$nextTick(() => {
        this.$bvModal.hide('import-agencies-modal');
      });
    },
  },
};
</script>
