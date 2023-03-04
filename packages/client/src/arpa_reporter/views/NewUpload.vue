<template>
  <div class="upload">
    <h1>Submit Workbook</h1>

    <div>
      <div v-if="error" class="mt-3 alert alert-danger" role="alert">
        {{ error }}
      </div>

      <form
        method="post"
        encType="multipart/form-data"
        ref="form"
        @submit.prevent="onSubmit"
      >
        <div class="form-group">
          <input
            class="form-control-file"
            type="file"
            id="spreadsheet"
            name="spreadsheet"
            @change="changeFiles"
            ref="files"
          />
        </div>
        <div class="form-group">
          <button
            class="btn btn-primary"
            type="submit"
            :disabled="uploadDisabled"
            @click.prevent="onSubmit"
          >
            {{ uploadButtonLabel }}
          </button>
          <a class="ml-3" href="#" @click="cancelUpload">Cancel</a>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { postForm } from '../store';

export default {
  name: 'NewUpload',
  data() {
    return {
      error: null,
      files: null,
      uploading: false,
    };
  },
  computed: {
    uploadButtonLabel() {
      return this.uploading ? 'Uploading...' : 'Upload';
    },
    uploadDisabled() {
      return this.files === null || this.uploading;
    },
  },
  methods: {
    changeFiles(evt) {
      this.files = evt.target.files;
    },
    async onSubmit() {
      const file = this.files[0];

      if (!file) {
        this.$refs.files.focus();
        return;
      }

      this.error = null;
      this.uploading = true;

      const formData = new FormData();
      formData.append('spreadsheet', file);

      // TODO: (#896) Actually include data when submitting
      // formData.append('notes', '<b>TEST & STRING!</b>');
      // formData.append('reportingPeriodId', '64');
      // formData.append('agencyId', '0');

      try {
        const resp = await postForm('/api/uploads', formData);
        const result = (await resp.json()) || { error: (await resp.body) };

        if (resp.ok) {
          const { upload } = result;
          if (!upload) throw new Error('Upload failed to return an upload ID');

          this.$store.commit('setRecentUploadId', upload.id);
          this.$router.push({ path: `/uploads/${upload.id}` });
        } else {
          const err = result.error || `${resp.statusText} (${resp.status})`;
          throw new Error(`Upload failed: ${err}`);
        }
      } catch (e) {
        this.error = e.message;
        this.uploading = false;
      }
    },

    cancelUpload(e) {
      e.preventDefault();
      this.$router.push({ path: '/' });
    },
  },
};
</script>

<!-- NOTE: This file was copied from src/views/NewUpload.vue (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z -->
