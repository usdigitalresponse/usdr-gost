<template>
  <div>
    <h2>Upload Period Template</h2>

    <p>
      This upload will be used as the template for period <em>{{ reportingPeriod.name }}</em>
    </p>

    <form
      method="post"
      encType="multipart/form-data"
      ref="form"
      @submit.prevent="uploadTemplate"
    >
      <div class="form-group">
        <input
          class="form-control"
          type="file"
          id="template"
          name="template"
          @change="changeFiles"
          ref="files"
        />
      </div>
      <div class="form-group">
        <button
          class="btn btn-primary"
          type="submit"
          :disabled="uploadDisabled"
          @click.prevent="uploadTemplate"
        >
          {{ uploadButtonLabel }}
        </button>
        <a class="ml-3" href="#" @click="cancelUpload">Cancel</a>
      </div>
    </form>
  </div>
</template>

<script>
import { postForm } from '../store';

export default {
  name: 'NewTemplate',
  data() {
    return {
      reportingPeriodId: this.$route.params.id,
      files: null,
      uploading: false,
      uploadedFilename: null,
    };
  },
  computed: {
    uploadButtonLabel() {
      return this.uploading ? 'Uploading...' : 'Upload';
    },
    uploadDisabled() {
      return this.files === null || this.uploading;
    },
    reportingPeriod() {
      return this.$store.state.reportingPeriods.find((p) => p.id === Number(this.reportingPeriodId));
    },
  },
  methods: {
    changeFiles() {
      this.files = this.$refs.files.files;
    },
    async uploadTemplate() {
      const file = this.files[0];

      if (!file) {
        this.$refs.files.focus();
        return;
      }

      this.uploading = true;

      const url = `/api/reporting_periods/${this.reportingPeriodId}/template`;
      const formData = new FormData();
      formData.append('template', file);

      try {
        const resp = await postForm(url, formData);
        const result = (await resp.json()) || { error: (await resp.body) };

        if (resp.ok) {
          this.$store.commit('addAlert', {
            text: `Uploaded new template for period ${this.reportingPeriodId}`,
            level: 'ok',
          });

          this.$store.dispatch('updateReportingPeriods');
          this.$store.dispatch('updateApplicationSettings');
          this.$router.push({ path: '/reporting_periods' });
        } else {
          const err = result.error || `${resp.statusText} (${resp.status})`;
          throw new Error(`Upload failed: ${err}`);
        }
      } catch (e) {
        this.$store.commit('addAlert', {
          text: `uploadTemplate Error: ${e.message}`,
          level: 'err',
        });
      }

      this.uploading = false;
    },
    cancelUpload(e) {
      e.preventDefault();
      this.$router.push({ path: '/reporting_periods' });
    },
  },
};
</script>

<!-- NOTE: This file was copied from src/views/NewTemplate.vue (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z -->
