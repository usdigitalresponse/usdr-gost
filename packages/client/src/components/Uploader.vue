<template>
  <div class="uploader">
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
          >
            {{ uploadButtonLabel }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Uploader',
  props: {
    uploadRecordType: String,
  },
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
        this.$refs.file.focus();
        return;
      }
      this.error = null;
      this.uploading = true;
      const formData = new FormData();
      formData.append('spreadsheet', file);
      try {
        const url = `/api/organizations/:organizationId/${this.uploadRecordType}/import`;
        const options = {
          method: 'POST',
          credentials: 'include',
          body: formData,
        };
        const resp = await fetch(url, options);
        if (typeof resp !== 'undefined'
          && typeof resp.ok !== 'undefined'
          && resp.ok === false) {
          const err = `${resp.statusText} (${resp.status})`;
          throw new Error(`Upload failed for: ${this.uploadURL}: ${err}`);
        }
        this.uploading = false;
        const ret = await resp.json();
        this.$emit('importStatus', ret);
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
