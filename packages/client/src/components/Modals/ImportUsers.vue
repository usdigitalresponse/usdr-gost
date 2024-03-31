<template>
  <div>
    <b-modal
      id="import-users-modal"
      ref="modal"
      v-model="modalVisible"
      title="Bulk Import Users"
      ok-only
    >
      <div>
        <ul>
          <li>Download the bulk import Excel template file by clicking <a href="./userImportTemplate.xlsx">here.</a></li>
          <li>Add new users to the Excel file and save it.</li>
          <li>Select your newly edited bulk import file using the <i>Choose File</i> button below, and click <i>Upload</i>.</li>
          <li>When the import is finished, the status of the import, including any errors, will be displayed below.</li>
        </ul>
        <RecordUploader
          :upload-record-type="'users'"
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
          // Reset result and refetch users when closing
          this.importResult = null;
          this.fetchUsers();
        }
        this.$emit('update:show', value);
      },
    },
  },
  methods: {
    ...mapActions({
      fetchUsers: 'users/fetchUsers',
    }),
    setStatus(status) {
      const { users, errors } = status.ret.status;
      this.importResult = {
        added: `Successful: ${users.added} users added`,
        notAdded: `Unsuccessful: ${users.errored} users not added`,
        errors,
      };
    },
  },
};
</script>
