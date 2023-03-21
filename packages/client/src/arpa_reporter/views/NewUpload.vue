<template>
  <div class="upload">
    <h1>Submit Workbook</h1>
    <FormulateForm
      name="new-upload"
      :form-errors="formErrors"
      v-model="values"
      :schema="schema"
      @submit="onSubmit"
    >
    <FormulateErrors
      class="alert alert-danger"
    />
    </FormulateForm>
  </div>
</template>

<script>
import Vue from 'vue';
import VueFormulate from '@braid/vue-formulate';
import _ from 'lodash';
import { postForm } from '../store';

Vue.use(VueFormulate, {
  classes: {
    outer: 'form-group',
    // eslint-disable-next-line no-unused-vars
    input: (context, classes) => {
      // set this to 'form-control' unless it's a file input
      const inputClass = context.type === 'file' ? 'form-control-file' : 'form-control';
      return [inputClass];
    },
    inputHasErrors: 'is-invalid',
    help: 'form-text text-muted',
    errors: 'list-unstyled text-danger',
  },
});
export default {
  data() {
    return {
      formErrors: [],
      values: this.initialValues(),
      schema: [
        {
          type: 'select',
          name: 'reportingPeriodId',
          label: 'Reporting Period',
          placeholder: 'Select one',
          options: this.reportingPeriodSelectItems(),
          validation: 'required',
          disabled: true,
        },
        {
          type: 'select',
          name: 'agencyId',
          label: 'Agency Code',
          options: this.agencySelectItems(),
          validation: 'required',
        },
        {
          type: 'file',
          label: 'Workbook File',
          name: 'spreadsheet',
          validation: 'required',
          uploader: this.uploadFile,
          // Don't upload the file until the form is submitted
          uploadBehavior: 'delayed',
        },
        {
          type: 'textarea',
          label: 'Notes',
          name: 'notes',
        },
        {
          component: 'div',
          class: 'd-flex',
          children: [
            {
              name: 'submit',
              type: 'submit',
              label: 'Submit',
              inputClass: ['btn', 'btn-primary'],
            },
            {
              type: 'button',
              label: 'Reset',
              inputClass: ['btn', 'btn-danger', 'ml-2'],
              '@click': this.onReset,
            },
          ],
        },
      ],
    };
  },
  methods: {
    initialValues() {
      return {
        reportingPeriodId: this.$store.getters.viewPeriodID ?? '',
        agencyId: this.$store.getters.user.agency.id,
      };
    },
    reportingPeriodSelectItems() {
      // create an object from this.$store.getters.viewableReportingPeriods where every key is period.id and every value is period.name
      return Object.fromEntries(this.$store.getters.viewableReportingPeriods.map((period) => [period.id, period.name]));
    },
    agencySelectItems() {
      return Object.fromEntries(this.$store.state.agencies.map((agency) => [agency.id, agency.code]));
    },
    // eslint-disable-next-line no-unused-vars
    async uploadFile(file, progress, error, options) {
      /* VueFormulate traditionally calls this method to upload the file
         to some remote location, but for now, we don't want to do that.
         It may eventually make sense to do that when we don't have access
         to the file system, e.g in a lambda context. For now though,
         we just return the file object. */
      return file;
    },
    async onSubmit(data) {
      const uploadFormData = new FormData();
      uploadFormData.append('spreadsheet', data.spreadsheet[0]);
      Object.entries(_.omit(data, ['spreadsheet'])).forEach(([key, value]) => {
        if (value !== undefined || value !== null) {
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
        this.formErrors = [e.message];
      }
    },
    onReset() {
      this.$formulate.reset('new-upload', this.initialValues());
      this.formErrors = [];
    },
  },
};
</script>
