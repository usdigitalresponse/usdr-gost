<template>
  <div>
    <div class="form-group row" v-for="col in cols" :key="col.field">
      <label :for="col.field" class="col-sm-2 col-form-label">{{ col.label }}</label>

      <div class="col-sm-10" >
        <select
          v-if="col.selectItems && col.selectItems.length > 0"
          class="form-control"
          :id="col.field"
          v-model="record[col.field]"
          :readonly="col.readonly"
          :class="classesForField(col.field)"
          :aria-describedby="`feedback-${col.field}`"
          >
          <option v-for="opt in col.selectItems" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>

        <input
          v-else
          :type="col.inputType || 'text'"
          class="form-control"
          :id="col.field"
          v-model="record[col.field]"
          :readonly="col.readonly"
          :class="classesForField(col.field)"
          :aria-describedby="`feedback-${col.field}`"
          />

        <div :id="`feedback-${col.field}`" class="invalid-feedback">
          <span v-for="error in errors[col.field]" :key="error">
            {{ error }}
          </span>
        </div>
      </div>
    </div>

    <div class="form-group row">
      <div class="col-sm-2"></div>
      <div class="col-sm-10">
        <button class="btn btn-primary" v-on:click="validateAndSave()" :disabled="disabled">Save</button>
        <button class="btn btn-secondary ml-2" v-on:click="$emit('reset')" :disabled="disabled">Reset</button>
      </div>
    </div>
  </div>
</template>

<script>
import moment from 'moment';

export default {
  name: 'StandardForm',
  props: {
    initialRecord: Object,
    cols: Array,
    /* example: {
      label: 'Person name',
      field: 'person_name',
      readonly: false,
      required: true,
      inputType: 'text',
      selectItems: [
        label: 'None', value: null,
        label: 'Bob', value: 'Robert'
      ]
    } */
    disabled: Boolean,
  },
  data() {
    return {
      wasValidated: false,
      errors: Object.fromEntries(this.cols.map((col) => [col.field, []])),
      record: Object.fromEntries(this.cols.map((col) => {
        let initValue = this.initialRecord[col.field];

        if (col.inputType === 'date') initValue = this.dateValue(initValue);

        return [col.field, initValue];
      })),
    };
  },
  methods: {
    dateValue(val) {
      const date = moment(val);
      if (date.isValid()) {
        return date.format('YYYY-MM-DD');
      }
      return null;
    },
    classesForField(field) {
      const col = this.cols.find((currCol) => currCol.field === field);
      if (col.readonly) return {};
      if (!this.wasValidated) return {};

      return {
        'is-valid': this.errors[field].length === 0,
        'is-invalid': this.errors[field].length > 0,
      };
    },
    validateAndSave() {
      this.cols.forEach((col) => {
        const { field } = col;
        const val = this.record[field];

        // clear errors; we will re-set them if they still exist
        this.errors[field] = [];

        // check required fields
        if (col.required && (val === undefined || val === null || val === '')) {
          this.errors[field].push(`${col.label} is a required field`);
        }
      });

      this.wasValidated = true;
      const hasErrors = Object.values(this.errors).some((errList) => errList.length > 0);
      if (!hasErrors) {
        this.$emit('save', this.record);
      }
    },
  },
};
</script>

<!-- NOTE: This file was copied from src/components/StandardForm.vue (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z -->
