<template>
  <div>
    <h1>Uploads</h1>

    <div class="row mb-4">
      <div class="col">
        <DownloadTemplateBtn />

        <router-link
          to="/new_upload"
          class="btn usdr-btn-primary ml-2"
        >
          Submit Workbook
        </router-link>
      </div>
    </div>

    <vue-good-table
      ref="uploadsTable"
      :columns="columns"
      :rows="rows"
      :group-options="groupOptions"
      :sort-options="{
        enabled: true,
        initialSortBy: defaultSortOrder
      }"
      style-class="vgt-table table table-striped table-bordered"
    >
      <template #table-actions>
        <div class="p-1">
          <div class="form-check form-check-inline">
            <input
              id="onlyExported"
              v-model="onlyExported"
              class="form-check-input"
              type="checkbox"
            >
            <!-- eslint-disable-next-line vuejs-accessibility/label-has-for  -->
            <label
              class="form-check-label"
              for="onlyExported"
            >Only exported to treasury?</label>
          </div>

          <div class="form-check form-check-inline">
            <input
              id="groupByAgency"
              v-model="groupByAgency"
              class="form-check-input"
              type="checkbox"
            >
            <!-- eslint-disable-next-line vuejs-accessibility/label-has-for  -->
            <label
              class="form-check-label"
              for="groupByAgency"
            >Group by agency?</label>
          </div>

          <button
            class="btn btn-secondary btn-sm"
            @click="resetFilters"
          >
            Reset Filters
          </button>
        </div>
      </template>

      <template #emptystate>
        No uploads
      </template>

      <template #table-row="props">
        <span v-if="props.column.field === 'id'">
          <router-link
            :to="`/uploads/${props.row.id}`"
            class="usdr-link"
          >
            {{ shortUuid(props.row.id) }}
          </router-link>
        </span>

        <span v-else-if="props.column.field === 'filename'">
          {{ props.row.filename }}
          <DownloadFileButton :upload="props.row" />
        </span>

        <span v-else>
          {{ props.formattedRow[props.column.field] }}
        </span>
      </template>
    </vue-good-table>
  </div>
</template>

<script>
/* eslint no-unused-vars: ["error", { "args": "none" }] */
import moment from 'moment';
import 'vue-good-table/dist/vue-good-table.css';
import { VueGoodTable } from 'vue-good-table';

import DownloadFileButton from '@/arpa_reporter/components/DownloadFileButton.vue';
import DownloadTemplateBtn from '@/arpa_reporter/components/DownloadTemplateBtn.vue';

import { getJson } from '@/arpa_reporter/store';
import { shortUuid } from '@/arpa_reporter/helpers/short-uuid';

export default {
  name: 'UploadsView',
  components: {
    VueGoodTable,
    DownloadFileButton,
    DownloadTemplateBtn,
  },
  data() {
    return {
      groupByAgency: false,
      onlyExported: false,
      exportedUploads: [],
    };
  },
  computed: {
    uploads() {
      return this.$store.state.allUploads;
    },
    agencies() {
      return this.$store.state.agencies;
    },
    groupOptions() {
      return {
        enabled: this.groupByAgency,
      };
    },
    defaultSortOrder() {
      return {
        field: 'validated_at',
        type: 'desc',
      };
    },
    rows() {
      const uploads = this.onlyExported ? this.exportedUploads : this.uploads;

      if (!this.groupByAgency) return uploads;

      const agencyObjects = {
        null: {
          mode: 'span',
          label: 'No agency set',
          children: [],
        },
      };

      for (const agency of this.agencies) {
        agencyObjects[agency.code] = {
          mode: 'span',
          label: `${agency.code} (${agency.name})`,
          children: [],
        };
      }

      for (const upload of uploads) {
        agencyObjects[upload.agency_code].children.push(upload);
      }

      return Object.values(agencyObjects);
    },
    columns() {
      const validatedCol = {
        label: 'Validated?',
        field: (rowObj) => ({ validatedAt: rowObj.validated_at, invalidatedAt: rowObj.invalidated_at }),
        formatFn: ({ validatedAt, invalidatedAt }) => {
          if (!validatedAt && !invalidatedAt) return 'Not set';
          if (invalidatedAt) {
            return `Invalidated on ${moment(invalidatedAt).local().format('MMM Do YYYY, h:mm:ss A')}`;
          }

          return moment(validatedAt).local().format('MMM Do YYYY, h:mm:ss A');
        },
        tdClass: (row) => ((!row.validated_at || row.invalidated_at) ? 'usdr-table-danger' : undefined),
        filterOptions: {
          enabled: !this.onlyExported,
          placeholder: 'Any validation status',
          filterDropdownItems: [
            { value: true, text: 'Show only validated' },
          ],
          filterFn: ({ validatedAt }) => validatedAt,
        },
        // x - row1 value for column
        // y - row2 value for column
        // col - column being sorted
        // rowX - row object for row1
        // rowY - row object for row2
        sortFn: (x, y, col, rowX, rowY) => {
          if (x.validated_at < y.validated_at) {
            return -1;
          }
          if (x.validated_at > y.validated_at) {
            return 1;
          }
          return 0;
        },
      };

      return [
        {
          label: 'ID',
          field: 'id',
        },
        {
          label: 'Agency',
          field: 'agency_code',
          tdClass: (row) => (!row.agency_code ? 'usdr-table-danger' : undefined),
          filterOptions: {
            enabled: true,
            placeholder: 'Any agency',
            filterDropdownItems: this.agencies.map((agency) => ({ value: agency.code, text: agency.code })),
          },
        },
        {
          label: 'EC Code',
          field: 'ec_code',
          tdClass: (row) => (!row.ec_code ? 'usdr-table-danger' : undefined),
          width: '120px',
          filterOptions: {
            enabled: true,
            placeholder: 'Filter...',
          },
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
          label: 'Filename',
          field: 'filename',
          filterOptions: {
            enabled: true,
            placeholder: 'Filter by filename...',
          },
        },
        {
          label: 'Notes',
          field: 'notes',
          filterOptions: {
            enabled: true,
            placeholder: 'Filter by notes...',
          },
        },
        validatedCol,
        {
          label: 'Validated At',
          field: 'validated_at',
          hidden: true,
        },
      ];
    },
    periodId() {
      return this.$store.state.viewPeriodID;
    },
  },
  watch: {
    async periodId() {
      this.$store.dispatch('updateUploads');
      this.loadExportedUploads();
    },
    onlyExported() { this.loadExportedUploads(); },
  },
  async mounted() {
    this.$store.dispatch('updateUploads');
    this.$store.dispatch('updateAgencies');
  },
  methods: {
    resetFilters() {
      this.$refs.uploadsTable.reset();
      this.$refs.uploadsTable.changeSort([this.defaultSortOrder]);
    },
    shortUuid,
    async loadExportedUploads() {
      this.exportedUploads = [];
      if (!this.onlyExported) return;

      const result = await getJson(`/api/reporting_periods/${this.periodId}/exported_uploads`);
      if (result.error) {
        this.$store.commit('addAlert', {
          text: `loadExportedUploads Error (${result.status}): ${result.error}`,
          level: 'err',
        });
      } else {
        this.exportedUploads = result.exportedUploads;
      }
    },
  },
};
</script>

<!-- NOTE: This file was copied from src/views/Uploads.vue (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z -->
