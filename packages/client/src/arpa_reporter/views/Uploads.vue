<template>
  <div>
    <h2>Uploads</h2>

    <div class="row mb-4">
      <div class="col">
        <DownloadTemplateBtn />

        <router-link to="/new_upload" class="btn btn-primary ml-2">
          Submit Spreadsheet
        </router-link>
      </div>
    </div>

    <vue-good-table
      :columns="columns"
      :rows="rows"
      :group-options="groupOptions"
      styleClass="vgt-table table table-striped table-bordered"
      ref="uploadsTable"
      >

      <div slot="table-actions" class="p-1">
        <div class="form-check form-check-inline">
          <input class="form-check-input" type="checkbox" id="onlyExported" v-model="onlyExported">
          <label class="form-check-label" for="onlyExported">Only exported to treasury?</label>
        </div>

        <div class="form-check form-check-inline">
          <input class="form-check-input" type="checkbox" id="groupByAgency" v-model="groupByAgency">
          <label class="form-check-label" for="groupByAgency">Group by agency?</label>
        </div>

        <button class="btn btn-secondary btn-sm" @click="resetFilters">Reset Filters</button>
      </div>

      <div slot="emptystate">
        No uploads
      </div>

      <template slot="table-row" slot-scope="props">
        <span v-if="props.column.field === 'id'">
          <router-link :to="`/uploads/${props.row.id}`">
            {{ shortUuid(props.row.id) }}
          </router-link>
        </span>

        <span v-else-if="props.column.field === 'filename'">
          {{ props.row.filename }}
          <DownloadFileButton :upload="props.row" />
        </span>

        <span v-else>
          {{props.formattedRow[props.column.field]}}
        </span>
      </template>

    </vue-good-table>
  </div>
</template>

<script>
import moment from 'moment'
import 'vue-good-table/dist/vue-good-table.css'
import { VueGoodTable } from 'vue-good-table'

import DownloadFileButton from '../components/DownloadFileButton'
import DownloadTemplateBtn from '../components/DownloadTemplateBtn'

import { getJson } from '../store/index'
import { shortUuid } from '../helpers/short-uuid'

export default {
  name: 'Uploads',
  data: function () {
    return {
      groupByAgency: false,
      onlyExported: false,
      exportedUploads: []
    }
  },
  computed: {
    uploads: function () {
      return this.$store.state.allUploads
    },
    agencies: function () {
      return this.$store.state.agencies
    },
    groupOptions: function () {
      return {
        enabled: this.groupByAgency
      }
    },
    rows: function () {
      const uploads = this.onlyExported ? this.exportedUploads : this.uploads

      if (!this.groupByAgency) return uploads

      const agencyObjects = {
        null: {
          mode: 'span',
          label: 'No agency set',
          children: []
        }
      }

      for (const agency of this.agencies) {
        agencyObjects[agency.code] = {
          mode: 'span',
          label: `${agency.code} (${agency.name})`,
          children: []
        }
      }

      for (const upload of uploads) {
        agencyObjects[upload.agency_code].children.push(upload)
      }

      return Object.values(agencyObjects)
    },
    columns: function () {
      const validatedCol = {
        label: 'Validated?',
        field: 'validated_at',
        formatFn: (date) => {
          if (!date) return 'Not set'
          return moment(date).local().format('MMM Do YYYY, h:mm:ss A')
        },
        tdClass: (row) => { if (!row.validated_at) return 'table-danger' },
        filterOptions: {
          enabled: true,
          placeholder: 'Any validation status',
          filterDropdownItems: [
            { value: true, text: 'Show only validated' }
          ],
          filterFn: (validatedAt, isIncluded) => validatedAt
        }
      }

      if (this.onlyExported) validatedCol.filterOptions = null

      return [
        {
          label: 'ID',
          field: 'id'
        },
        {
          label: 'Agency',
          field: 'agency_code',
          tdClass: (row) => { if (!row.agency_code) return 'table-danger' },
          filterOptions: {
            enabled: true,
            placeholder: 'Any agency',
            filterDropdownItems: this.agencies.map(agency => ({ value: agency.code, text: agency.code }))
          }
        },
        {
          label: 'EC Code',
          field: 'ec_code',
          tdClass: (row) => { if (!row.ec_code) return 'table-danger' },
          width: '120px',
          filterOptions: {
            enabled: true,
            placeholder: 'Filter...'
          }
        },
        {
          label: 'Uploaded By',
          field: 'created_by',
          filterOptions: {
            enabled: true,
            placeholder: 'Filter by email...'
          }
        },
        {
          label: 'Filename',
          field: 'filename',
          filterOptions: {
            enabled: true,
            placeholder: 'Filter by filename...'
          }
        },
        validatedCol
      ]
    },
    periodId: function () {
      return this.$store.state.viewPeriodID
    }
  },
  methods: {
    resetFilters: function (evt) {
      this.$refs.uploadsTable.reset()
      this.$refs.uploadsTable.changeSort([])
    },
    shortUuid,
    loadExportedUploads: async function (evt) {
      this.exportedUploads = []
      if (!this.onlyExported) return

      const result = await getJson(`/api/reporting_periods/${this.periodId}/exported_uploads`)
      if (result.error) {
        this.$store.commit('addAlert', {
          text: `loadExportedUploads Error (${result.status}): ${result.error}`,
          level: 'err'
        })
      } else {
        this.exportedUploads = result.exportedUploads
      }
    }
  },
  watch: {
    periodId: async function () {
      this.$store.dispatch('updateUploads')
      this.loadExportedUploads()
    },
    onlyExported: function () { this.loadExportedUploads() }
  },
  mounted: async function () {
    this.$store.dispatch('updateUploads')
    this.$store.dispatch('updateAgencies')
  },
  components: {
    VueGoodTable,
    DownloadFileButton,
    DownloadTemplateBtn
  }
}
</script>

<!-- NOTE: This file was copied from src/views/Uploads.vue (git @ d124c44d0e) in the arpa-reporter repo on 2022-09-08T23:48:24.330Z -->
