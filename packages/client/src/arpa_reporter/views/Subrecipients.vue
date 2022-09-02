<template>
  <div>
    <h2>Sub-recipients</h2>

    <div v-if="loading" class="spinner-grow text-primary" role="status">
        <span class="sr-only">Loading...</span>
    </div>

    <vue-good-table
      v-else
      :columns="columns"
      :rows="rows"
      styleClass="vgt-table table table-striped table-bordered"
      ref="recipientsTable"
      >

      <div slot="table-actions" class="form-check from-check-inline p-2">
        <button class="btn btn-secondary btn-sm ml-2" @click="resetFilters">Reset Filters</button>
      </div>

      <div slot="emptystate">
        No Recipients
      </div>

      <template slot="table-row" slot-scope="props">
        <span v-if="props.column.field === 'upload_id'">
          <router-link :to="`/uploads/${props.row.upload_id}`">
            {{ props.row.upload_id }}
          </router-link>
        </span>

        <ul v-else-if="props.column.field === 'record'" class="list-group list-group-flush">
          <template v-for="(value, col) in props.row.json">
            <template v-if="col === 'Unique_Entity_Identifier__c' || col === 'EIN__c'">
            </template>

            <li v-else class="list-group-item" :key="col">
              <span class="font-weight-bold">{{ col }}: </span>
              {{ value }}
            </li>
          </template>
        </ul>

        <span v-else-if="props.column.field === 'edit'">
          <router-link tag="button" class="btn btn-sm btn-secondary" :to="`/subrecipients/${props.row.id}`">Edit</router-link>
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

import { getJson } from '../store/index'

export default {
  name: 'Subrecipients',
  data: function () {
    return {
      loading: false,
      recipients: []
    }
  },
  computed: {
    rows: function () {
      return this.recipients.map(r => {
        r.json = JSON.parse(r.record)
        return r
      })
    },
    columns: function () {
      return [
        {
          label: 'UEI',
          field: 'uei',
          filterOptions: {
            enabled: true,
            placeholder: 'Filter by UEI...'
          }
        },
        {
          label: 'TIN / EIN',
          field: 'tin',
          filterOptions: {
            enabled: true,
            placeholder: 'Filter by IRS ID...'
          }
        },
        {
          label: 'Details',
          field: 'record',
          filterOptions: {
            enabled: true,
            placeholder: 'Search...'
          }
        },
        {
          label: 'Created',
          field: 'created_at',
          formatFn: (date) => {
            if (!date) return 'Not set'
            return moment(date).local().format('MMM Do YYYY, h:mm:ss A')
          }
        },
        {
          label: 'Upload ID',
          field: 'upload_id'
        },
        {
          label: 'Edit',
          field: 'edit'
        }
      ]
    }
  },
  methods: {
    resetFilters: function (evt) {
      this.$refs.recipientsTable.reset()
      this.$refs.recipientsTable.changeSort([])
    },
    loadRecipients: async function (evt) {
      this.loading = true

      const result = await getJson('/api/subrecipients')
      if (result.error) {
        this.$store.commit('addAlert', {
          text: `loadRecipients Error (${result.status}): ${result.error}`,
          level: 'err'
        })
      } else {
        this.recipients = result.recipients
      }

      this.loading = false
    }
  },
  mounted: async function () {
    this.loadRecipients()
  },
  components: {
    VueGoodTable
  }
}
</script>

<!-- NOTE: This file was copied from src/views/Subrecipients.vue (git @ 98c1aa2586) in the arpa-reporter repo on 2022-09-02T05:09:55.179Z -->
