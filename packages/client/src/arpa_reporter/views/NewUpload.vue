<template>
  <div>

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
import { postForm } from '../store';

Vue.use(VueFormulate, {
  classes: {
    prefix: 'formulate-',
    outer: 'form-group',
    input: (context, classes) => {
      // set this to 'form-control' unless it's a file input
      const inputClass = context.type === 'file' ? '' : 'form-control';
      return [classes, inputClass].join(' ');
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
      initialValues: () => ({
        reportingPeriodId: this.$store.getters.viewPeriodID ?? '',
        agencyId: this.$store.getters.user.agency.id,
      }),

      values: {},
      schema: [
        {
          type: 'select',
          name: 'reportingPeriodId',
          label: 'Reporting Period',
          placeholder: 'Select one',
          options: this.reportingPeriodSelectItems(),
          validation: 'required',
        },
        {
          type: 'select',
          name: 'agencyId',
          label: 'Agency Code',
          options: this.agencySelectItems(),
          validation: 'required',
        },
        {
          type: 'text',
          label: 'Expenditure Code',
          name: 'expenditure_code',
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
  created() {
    this.values = this.initialValues();
  },
  methods: {
    reportingPeriodSelectItems() {
      // create an object from this.$store.getters.viewableReportingPeriods where every key is period.id and every value is period.name
      return Object.fromEntries(this.$store.getters.viewableReportingPeriods.map((period) => [period.id, period.name]));
    },
    agencySelectItems() {
      return Object.fromEntries(this.$store.state.agencies.map((agency) => [agency.id, agency.name]));
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
    async onSubmit(formData) {
      // This is technically a FileList, allowing for multiple uploads if configured
      // this way, but for now we have only a single file.
      const file = formData.spreadsheet[0];
      const uploadData = {
        reportingPeriodId: formData.reportingPeriodId,
        agencyId: formData.agencyId,
        expenditure_code: formData.expenditure_code,
        notes: formData.notes,
      };
      const uploadFormData = new FormData();
      uploadFormData.append('spreadsheet', file);
      Object.keys(uploadData).forEach((key) => {
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
