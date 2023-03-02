<template>
  <div class="upload">
    <h1>Submit Workbook</h1>
    <div>
      <b-alert
        :show="error"
        variant="Danger"
        class="mt-3"
      >
        {{ error }}
      </b-alert>
      <StandardForm
        :fields="fields"
        @submit="onSubmit"
        @reset="onReset"
        :key="formKey"
        enctype="multipart/form-data"
      />
    </div>
  </div>
</template>

<script>
import {
  BAlert
} from "bootstrap-vue";
import { postForm } from '../store';
import StandardForm from '../components/StandardForm';
import { required,  } from 'vuelidate/lib/validators';

export default {
  name: 'NewUpload',
  components: {
    StandardForm,
    BAlert
  },
  data() {
    return {
      error: null,
      files: null,
      uploading: false,
      formKey: Date.now(),
    };
  },
  computed: {
    uploadButtonLabel() {
      return this.uploading ? 'Uploading...' : 'Upload';
    },
    uploadDisabled() {
      return this.files === null || this.uploading;
    },
    upload() {
      return {
        reporting_period: this.$store.getters.viewPeriod.id,
      };
    },
    fields() {
      return [
        {
          type: 'select',
          label: 'Reporting Period',
          name: 'reporting_period',
          options: this.reportingPeriodSelectItems,
          initialValue: this.$store.getters.viewPeriodID ?? '',
          validationRules: {required}
        },
        {
          type: 'select',
          label: 'Agency Code',
          name: 'agency_code',
          options: this.agencySelectItems,
          initialValue: this.$store.getters.user.agency.id,
          validationRules: {required}
        },
        {
          type: 'text',
          label: 'Expenditure Code',
          name: 'expenditure_code',
          validationRules: {required}
        },
        {
          type: 'file',
          label: 'Workbook File',
          name: 'spreadsheet',
          validationRules: {required},
          onChange: "changeFiles"
        },
        {
          type: 'textarea',
          label: 'Notes',
          name: 'notes',
        },
      ];
    },
    reportingPeriodSelectItems() {
      return this.$store.getters.viewableReportingPeriods.map((period) => ({ text: period.name, value: period.id }));
    },
    agencySelectItems() {
      return this.$store.state.agencies.map((agency) => ({ text: agency.name, value: agency.id }));
    },
  },
  methods: {
    changeFiles(evt) {
      this.files = evt.target.files;
    },
    async onSubmit(formData) {
      this.error = null;
      this.uploading = true;
      const file = formData.spreadsheet;

      // For now this is the same as formData, but making this explicit
      // to ensure we know what we're passing.
      const uploadData = {
        reporting_period: formData.reporting_period,
        agency_code: formData.agency_code,
        expenditure_code: formData.expenditure_code,
        notes: formData.notes
      };

      const uploadFormData = new FormData();
      uploadFormData.append('spreadsheet', file);
      Object.keys(uploadData).forEach(key => {
        const value = uploadData[key];
        if (value) {
          uploadFormData.append(key, value);
        }
      });

      try {
        const resp = await postForm('/api/uploads', uploadFormData);
        const result = (await resp.json()) || { error: await resp.body };

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
    onReset() {
      this.formKey = Date.now();
    },
  },
};
</script>

<!-- NOTE: This file was copied from src/views/NewUpload.vue (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z -->
