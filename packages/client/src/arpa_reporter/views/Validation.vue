<template>
  <div>
    <h2>Validation</h2>

    <div class="row">
      <div class="col">
        <p>
          Reporting period {{ periodName }} has {{ uploads.length }} uploads.
          {{ validUploads.length }} of these are currently valid.
        </p>
      </div>

      <div class="col form-inline">
        <div class="form-check">
          <input class="form-check-input" type="checkbox" id="commitRevalidate" v-model="commit">
          <label class="form-check-label" for="commitRevalidate">
            Actually mark with updated validity?
          </label>
        </div>

        <button class="btn ml-2" :class="revalidateBtnClass" @click="revalidate" :disabled="disableRevalidateBtn">
          <span v-if="revalidating" class="spinner-grow spinner-grow-sm" role="status">
          </span>
          <span v-if="revalidating"> Loading...</span>
          <span v-else>
            <span v-if="commit">Revalidate uploads</span>
            <span v-else>Check upload validity</span>
          </span>
        </button>
      </div>
    </div>

    <div v-if="updates">
      <h3>Revalidation results</h3>

      <div class="row">
        <p class="col">
          After re-validation, the reporting period
          <span v-if="commit">has</span>
          <span v-else>will have</span>
          {{ validAfterRevalidation.length }} valid uploads --
          <span v-if="revalidationDiff > 0" class="text-success">{{ Math.abs(revalidationDiff) }} more</span>
          <span v-else-if="revalidationDiff < 0" class="text-danger">{{ Math.abs(revalidationDiff) }} fewer</span>
          <span v-else-if="updateRows.length > 0">
            with a total of {{ updateRows.length }} uploads <span class="text-warning">changing state</span>
          </span>
          <span v-else class="text-info">same as before.</span>
          .
        </p>
      </div>

      <vue-good-table
        v-if="updateRows.length > 0"
        :columns="updateCols"
        :rows="updateRows"
        styleClass="vgt-table table table-striped table-bordered"
        >
        <div slot="emptystate">
          Nothing to display; adjust your filters?
        </div>

        <template slot="table-row" slot-scope="props">
          <span v-if="props.column.field === 'id'">
            <router-link :to="`/uploads/${props.row.id}`">
              {{ props.row.id }}
            </router-link>
          </span>

          <span v-else>
            {{props.formattedRow[props.column.field]}}
          </span>
        </template>
      </vue-good-table>
    </div>
  </div>
</template>

<script>
import 'vue-good-table/dist/vue-good-table.css';
import { VueGoodTable } from 'vue-good-table';

import { post } from '../store/index';

export default {
  name: 'Validation',
  data() {
    return {
      commit: false,
      revalidating: false,
      updates: null,
    };
  },
  computed: {
    revalidateBtnClass() {
      return {
        'btn-primary': !this.commit,
        'btn-danger': this.commit,
      };
    },
    disableRevalidateBtn() {
      return (
        this.uploads.length === 0
        || this.revalidating
      );
    },
    uploads() {
      return this.$store.state.allUploads;
    },
    agencies() {
      return this.$store.state.agencies;
    },
    validUploads() {
      return this.uploads.filter((upl) => upl.validated_at);
    },
    validAfterRevalidation() {
      if (!this.updates) return [];
      return this.updates.filter((update) => update.errors.length === 0).map((update) => update.upload);
    },
    revalidationDiff() {
      return this.validAfterRevalidation.length - this.validUploads.length;
    },
    updateCols() {
      return [
        {
          label: '#',
          field: 'id',
          type: 'number',
        },
        {
          label: 'Agency',
          field: 'agency_code',
          tdClass: (row) => (row.agency_code ? '' : 'table-danger'),
          filterOptions: {
            enabled: true,
            placeholder: 'Any agency',
            filterDropdownItems: this.agencies.map((agency) => ({ value: agency.code, text: agency.code })),
          },
        },
        {
          label: 'EC Code',
          field: 'ec_code',
          tdClass: (row) => (row.ec_code ? '' : 'table-danger'),
        },
        {
          label: 'Uploaded By',
          field: 'created_by',
          filterOptions: {
            enabled: true,
            placeholder: 'Filter by email...',
          },
        },
        {
          label: 'Was valid?',
          field: 'was_valid',
          type: 'boolean',
          tdClass: (row) => (row.was_valid ? 'table-success' : 'table-danger'),
          formatFn: (wasValid) => (wasValid ? 'true' : 'false'),
          filterOptions: {
            enabled: true,
            placeholder: 'Any status',
            filterDropdownItems: [
              { value: true, text: 'Show only previously-valid' },
            ],
            // eslint-disable-next-line no-unused-vars
            filterFn: (wasValid, isIncluded) => wasValid,
          },
        },
        {
          label: this.commit ? 'Became valid?' : 'Becomes valid?',
          field: 'became_valid',
          type: 'boolean',
          tdClass: (row) => (row.became_valid ? 'table-success' : 'table-danger'),
          filterOptions: {
            enabled: true,
            placeholder: 'Any status',
            filterDropdownItems: [
              { value: true, text: 'Show only previously-valid' },
            ],
            // eslint-disable-next-line no-unused-vars
            filterFn: (remainsValid, isIncluded) => remainsValid,
          },
        },
      ];
    },
    updateRows() {
      if (!this.updates) return [];

      return this.updates
        .filter((update) => (
          (update.upload.validated_at && update.errors.length > 0)
          || (update.errors.length === 0 && !update.upload.validated_at)
        ))
        .map((update) => ({
          id: update.upload.id,
          agency_code: update.upload.agency_code,
          ec_code: update.upload.ec_code,
          created_by: update.upload.created_by,
          was_valid: update.upload.validated_at,
          became_valid: update.errors.length === 0,
          errors: update.errors,
        }));
    },
    periodId() {
      return this.$store.state.viewPeriodID;
    },
    periodName() {
      return this.$store.getters.viewPeriod.name;
    },
  },
  methods: {
    async revalidate() {
      this.revalidating = true;
      this.updates = null;

      try {
        const result = await post(
          `/api/reporting_periods/${this.periodId}/revalidate?commit=${this.commit}`,
        );

        if (result.errors) {
          this.$store.commit('addAlert', {
            text: 'Error re-validating uploads',
            level: 'err',
          });
        } else {
          this.updates = result.updates;
        }
      } catch (error) {
        // we got an error from the backend, but the backend didn't send reasons
        this.$store.commit('addAlert', {
          text: `revalidate Error: ${error.message}`,
          level: 'err',
        });
      }

      this.revalidating = false;
    },
  },
  watch: {
    async periodId() {
      this.$store.dispatch('updateUploads');
    },
  },
  async mounted() {
    this.$store.dispatch('updateUploads');
  },
  components: {
    VueGoodTable,
  },
};
</script>

<!-- NOTE: This file was copied from src/views/Validation.vue (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z -->
