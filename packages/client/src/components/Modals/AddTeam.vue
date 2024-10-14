<!-- Adding this at the top because the rule was still getting flagged when added next-line -->
<!-- eslint-disable vuejs-accessibility/no-autofocus -->
<!-- eslint-disable max-len -->
<template>
  <b-modal
    id="add-agency-modal"
    ref="modal"
    v-model="modalVisible"
    :title="newTerminologyEnabled ? 'Add Team' : 'Add Agency'"
    :ok-disabled="v$.formData.$invalid"
    @ok="handleOk"
  >
    <form
      ref="form"
      @submit.stop.prevent="handleSubmit"
    >
      <b-form-group
        :state="!v$.formData.name.$invalid"
        label-for="name-input"
        invalid-feedback="Required"
      >
        <template #label>
          Name
        </template>
        <b-form-input
          id="name-input"
          v-model="formData.name"
          autofocus
          type="text"
          required
        />
      </b-form-group>
      <b-form-group
        :state="!v$.formData.abbreviation.$invalid"
        label-for="abbreviation-input"
        invalid-feedback="Required"
      >
        <template #label>
          Abbreviation
        </template>
        <template #description>
          This is used for displaying lists of {{ newTerminologyEnabled ? 'teams' : 'agencies' }} in compact form (e.g. in a table).
        </template>
        <b-form-input
          id="abbreviation-input"
          v-model="formData.abbreviation"
          type="text"
          min="2"
          max="8"
          required
        />
      </b-form-group>
      <b-form-group
        :state="!v$.formData.code.$invalid"
        label-for="code-input"
        invalid-feedback="Required"
      >
        <template #label>
          Code
        </template>
        <template #description>
          This should match the Agency Code field in ARPA Reporter workbook uploads. If not using ARPA Reporter, you can set this the same as Abbreviation. This field must be unique across {{ newTerminologyEnabled ? 'teams' : 'agencies' }}.
        </template>
        <b-form-input
          id="code-input"
          v-model="formData.code"
          type="text"
          min="2"
          max="8"
          :placeholder="formData.abbreviation"
        />
      </b-form-group>
      <b-form-group
        :state="!v$.formData.parentAgency.$invalid"
        label-for="agency-input"
        :invalid-feedback="newTerminologyEnabled ? 'Must select a parent team' : 'Must select a parent agency'"
      >
        <template #label>
          Parent {{ newTerminologyEnabled ? 'Team' : 'Agency' }}
        </template>
        <v-select
          v-model="formData.parentAgency"
          :options="agencies"
          label="name"
          :value="formData.parentAgency"
        >
          <template #search="{attributes, events}">
            <input
              v-bind="attributes"
              class="vs__search"
              :required="!formData.parentAgency"
              v-on="events"
            >
          </template>
        </v-select>
      </b-form-group>
      <b-form-group
        :state="!v$.formData.warningThreshold.$invalid"
        label-for="warningThreshold-input"
        invalid-feedback="Warning Threshold must be 2 or greater"
      >
        <template #label>
          Close Date <span class="text-warning">Warning</span> Threshold
        </template>
        <template #description>
          How many days out to show grant close dates with <span class="text-warning">warning</span> status
        </template>
        <b-form-input
          id="warningThreshold-input"
          v-model="formData.warningThreshold"
          type="number"
          min="2"
          required
        />
      </b-form-group>
      <b-form-group
        :state="!v$.formData.dangerThreshold.$invalid"
        label-for="dangerThreshold-input"
        invalid-feedback="Danger Threshold must be greater than 0 and less than Warning Threshold"
      >
        <template #label>
          Close Date <span class="text-danger">Danger</span> Threshold
        </template>
        <template #description>
          How many days out to show grant close dates with <span class="text-danger">danger</span> status
        </template>
        <b-form-input
          id="dangerThreshold-input"
          v-model="formData.dangerThreshold"
          type="number"
          min="1"
          required
        />
      </b-form-group>
    </form>
  </b-modal>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import { useVuelidate } from '@vuelidate/core';
import {
  required,
  requiredUnless,
  numeric,
  minValue,
} from '@vuelidate/validators';
import { newTerminologyEnabled } from '@/helpers/featureFlags';

export default {
  props: {
    show: Boolean,
  },
  setup() {
    return { v$: useVuelidate() };
  },
  data() {
    return {
      formData: {
        name: null,
        abbreviation: null,
        code: null,
        warningThreshold: 14,
        dangerThreshold: 7,
        parentAgency: null,
      },
    };
  },
  validations: {
    formData: {
      name: {
        required,
      },
      abbreviation: {
        required,
      },
      code: {
        required: requiredUnless(function () {
          return this.canDefaultCodeToAbbreviation;
        }),
      },
      warningThreshold: {
        required,
        numeric,
        minValue: minValue(2),
      },
      dangerThreshold: {
        required,
        numeric,
        minValue: minValue(1),
        dangerLessThanWarning: function dangerLessThanWarning() {
          return Number(this.formData.dangerThreshold) < Number(this.formData.warningThreshold);
        },
      },
      parentAgency: {
        required,
      },
    },
  },
  computed: {
    ...mapGetters({
      loggedInUser: 'users/loggedInUser',
    }),
    modalVisible: {
      get() { return this.show; },
      set(value) { this.$emit('update:show', value); },
    },
    agencies() {
      if (!this.loggedInUser) {
        return [];
      }
      return this.loggedInUser.agency.subagencies;
    },
    canDefaultCodeToAbbreviation() {
      return Boolean(this.formData.abbreviation && this.formData.abbreviation.trim().length > 0);
    },
    newTerminologyEnabled() {
      return newTerminologyEnabled();
    },
  },
  watch: {
    modalVisible() {
      // Reset form data when modal is shown
      Object.assign(this.formData, this.$options.data.apply(this).formData);
    },
  },
  methods: {
    ...mapActions({
      createAgency: 'agencies/createAgency',
    }),
    handleOk(bvModalEvt) {
      bvModalEvt.preventDefault();
      this.handleSubmit();
    },
    async handleSubmit() {
      if (this.v$.formData.$invalid) {
        return;
      }
      const body = {
        ...this.formData,
        code: this.formData.code || this.formData.abbreviation,
        parentId: this.formData.parentAgency.id,
      };
      // TODO(mbroussard): this can potentially fail if e.g. name or code is not unique, and we don't
      // do anything useful to handle such an error in the UI right now.
      await this.createAgency(body);
      this.modalVisible = false;
    },
  },
};
</script>
