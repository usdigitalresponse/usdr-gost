<template>
  <div>
    <b-form @submit.prevent="onSubmit" @reset="onReset" enctype="enctype">
      <b-form-group
        v-for="(field, index) in fields"
        :key="index"
        :label="field.label"
        :label-for="field.name"
        :invalid-feedback="getFieldValidationMessage(field.name)"
        :state="validateState(field.name)"
        label-cols-sm="2"
        content-cols-sm="4"
      >
        <component
          :is="getComponentType(field.type)"
          :name="field.name"
          :v-validate="field.validation"
          v-model="$v.formData[field.name].$model"
          :state="validateState(field.name)"
          v-bind="getFieldAttributes(field)"
          @input="field.onChange ? field.onChange(field.name, $event.target.value) : null"
          @change="field.validationRules ? $v.formData[field.name].$touch() : ''"
        />
      </b-form-group>
      <b-button type="submit" variant="primary" :disabled="$v.formData.$invalid"
        >Submit</b-button
      >
      <b-button type="reset" variant="danger" class="ml-2">Reset</b-button>
    </b-form>
  </div>
</template>

<script>
import {
  BForm,
  BFormDatepicker,
  BFormGroup,
  BFormInput,
  BFormSelect,
  BFormTextarea,
  BButton,
  BAlert,
  BFormFile,
} from "bootstrap-vue";
import { validationMixin } from "vuelidate";

export default {
  name: "StandardForm",
  mixins: [validationMixin],
  components: {
    BForm,
    BFormGroup,
    BFormInput,
    BFormSelect,
    BFormTextarea,
    BFormFile,
    BButton,
    BAlert,
    BFormDatepicker,
  },
  props: {
    /* example: {
          type: 'select',
          label: 'Reporting Period', 
          name: 'reporting_period', 
          options: [{"text": "A", "value":"a"}, {"text": "B", "value":"b"}, ], 
          initialValue: this.$store.getters.viewPeriodID ?? '',
          validationRules: {required}
        },
        {
          type: 'text',
          label: 'Expenditure Code',
          name: 'expenditure_code', 
          validationRules: {required}
        },
    */
    fields: {
      type: Array,
      required: true,
    },
    enctype: {
      type: String,
      required: false,
    },
  },
  data() {
    const formData = {};

    // Set initial values for each field
    this.fields.forEach((f) => {
      let initialValue = undefined;
      if (f.initialValue !== undefined) {
        initialValue = f.initialValue;
      }
      formData[f.name] = initialValue;
    });

    return {
      formData : formData
    };
  },
  methods: {
    getComponentType(type) {
      switch (type) {
        case "text":
          return "b-form-input";
        case "date":
          return "b-form-datepicker";
        case "file":
          return "b-form-file";
        case "email":
          return "b-form-input";
        case "select":
          return "b-form-select";
        case "textarea":
          return "b-form-textarea";
        default:
          return "b-form-input";
      }
    },
    getFieldAttributes(field) {
      let sharedAttributes = {
        id: field.name,
        name: field.name,
        disabled: field.disabled || false,
        placeholder: field.placeholder || "",
        readonly: field.readonly,
      };
      let typeSpecificAttributes = {};
      if (field.type === "select") {
        typeSpecificAttributes.options = field.options || [];
      } else if (field.type === "date") {
        typeSpecificAttributes.placeholder = "Choose a date";
        typeSpecificAttributes["calendar-width"] = "100%";
        typeSpecificAttributes["date-format-options"] = {
          year: "numeric",
          month: "numeric",
          day: "numeric",
        };
        typeSpecificAttributes["today-button"] = true;
        typeSpecificAttributes["reset-button"] = true;
        typeSpecificAttributes["close-button"] = true;
      } else if (field.type === "file") {
        typeSpecificAttributes.type = "file";
        typeSpecificAttributes.accept = field.accept || "";
        if (field.onChange) {
          typeSpecificAttributes["@" + field.onChange] = this.handleCustomChangeEvent;
        }
        // typeSpecificAttributes["@change"] = field.onChange;
      } else if (field.type === "email") {
        typeSpecificAttributes.type = "email";
      } else if (field.type === "text") {
        typeSpecificAttributes.type = "text";
      }
      return Object.assign(sharedAttributes, typeSpecificAttributes, field.props || {});
    },
    validateState(fieldName) {
      const { $dirty, $error } = this.$v.formData[fieldName];
      return $dirty ? !$error : null;
    },
    getFieldValidationMessage(fieldName) {
      const formLabel = this.fields.find((f) => f.name == fieldName).label;

      // Check whether the chosen validators are false, meaning invalid
      if (!this.$v.formData[fieldName].required) {
        return `${formLabel} must not be empty`;
      } else if (!this.$v.formData[fieldName].email) {
        return `${formLabel} must be a properly-formatted email address`;
      }
    },
    onSubmit() {
      this.$v.formData.$touch();
      if (this.$v.$invalid) {
        return;
      }
      if (!this.$v.$anyError) {
        this.$emit("submit", this.formData);
      }
    },
    onReset() {
      this.fields.forEach((field) => {
        this.formData[field.name] = field.initialValue || "";
        this.$v.formData[field.name].$reset();
      });
      this.$v.formData.$touch();
      this.$emit("reset");
    },
  },
  created() {},
  validations() {
    const validationRules = {};

    // Define validation rules for each field
    this.fields.forEach((f) => {
      if (f.validationRules && !f.readonly) {
        validationRules[f.name] = f.validationRules;
      } else {
        validationRules[f.name] = [];
      }
    });

    return {
      formData: validationRules,
    };
  },
};
</script>
