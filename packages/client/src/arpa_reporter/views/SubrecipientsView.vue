<template>
  <div>
    <h2>Sub-recipients</h2>

    <div
      v-if="loading"
      class="spinner-grow text-primary"
      role="status"
    >
      <span class="sr-only">Loading...</span>
    </div>

    <vue-good-table
      v-else
      ref="recipientsTable"
      :columns="columns"
      :rows="rows"
      style-class="vgt-table table table-striped table-bordered"
    >
      <div
        slot="table-actions"
        class="form-check from-check-inline p-2"
      >
        <button
          class="btn btn-secondary btn-sm ml-2"
          @click="resetFilters"
        >
          Reset Filters
        </button>
      </div>

      <div slot="emptystate">
        No Recipients
      </div>

      <template
        slot="table-row"
        slot-scope="props"
      >
        <div :class="{strikethrough: props.row.archived_at && props.column.field !== 'edit'}">
          <span v-if="props.column.field === 'upload_id'">
            <router-link :to="`/uploads/${props.row.upload_id}`">
              {{ props.row.upload_id }}
            </router-link>
          </span>

          <ul
            v-else-if="props.column.field === 'record'"
            class="list-group list-group-flush"
          >
            <template v-for="(value, col) in props.row.json">
              <template v-if="col === 'Unique_Entity_Identifier__c' || col === 'EIN__c'" />

              <li
                v-else
                :key="col"
                class="list-group-item"
              >
                <span class="font-weight-bold">{{ col }}: </span>
                {{ value }}
              </li>
            </template>
          </ul>

          <span
            v-else-if="props.column.field === 'edit'"
            class="d-flex flex-column"
          >
            <router-link
              v-if="!props.row.archived_at"
              tag="button"
              class="btn btn-sm btn-secondary mb-2"
              :to="`/subrecipients/${props.row.id}`"
            >Edit</router-link>
            <button
              v-if="props.row.archived_at"
              class="btn btn-sm btn-primary"
              @click="archiveOrRestoreSubrecipient(props.row.id)"
            >Restore</button>
            <button
              v-else
              class="btn btn-sm btn-outline-danger"
              @click="archiveOrRestoreSubrecipient(props.row.id)"
            >Archive</button>
          </span>

          <span v-else>
            {{ props.formattedRow[props.column.field] }}
          </span>
        </div>
      </template>
    </vue-good-table>
  </div>
</template>

<script>
import moment from 'moment';
import 'vue-good-table/dist/vue-good-table.css';
import { VueGoodTable } from 'vue-good-table';

import { getJson, post } from '../store/index';

export default {
  name: 'SubrecipientsView',
  components: {
    VueGoodTable,
  },
  data() {
    return {
      loading: false,
      recipients: [],
    };
  },
  computed: {
    rows() {
      const rows = this.recipients.map((r) => ({ ...r, json: JSON.parse(r.record) }));
      return rows;
    },
    columns() {
      return [
        {
          label: 'UEI',
          field: 'uei',
          filterOptions: {
            enabled: true,
            placeholder: 'Filter by UEI...',
          },
        },
        {
          label: 'TIN / EIN',
          field: 'tin',
          filterOptions: {
            enabled: true,
            placeholder: 'Filter by IRS ID...',
          },
        },
        {
          label: 'Details',
          field: 'record',
          filterOptions: {
            enabled: true,
            placeholder: 'Search...',
          },
        },
        {
          label: 'Created',
          field: 'created_at',
          formatFn: (date) => {
            if (!date) return 'Not set';
            return moment(date).local().format('MMM Do YYYY, h:mm:ss A');
          },
        },
        {
          label: 'Upload ID',
          field: 'upload_id',
        },
        {
          label: 'Edit',
          field: 'edit',
        },
      ];
    },
  },
  async mounted() {
    this.loadRecipients();
  },
  methods: {
    resetFilters() {
      this.$refs.recipientsTable.reset();
      this.$refs.recipientsTable.changeSort([]);
    },

    /**
     * Archive or restore a subrecipient.
     *
     * Call this method to archive or unarchive a subrecipient record.
     *
     * @param {*} id
     * The ID of the subrecipient to archive or restore.
     */
    async archiveOrRestoreSubrecipient(id) {
      this.loading = true;

      const result = await post(`/api/subrecipients/archive/${id}`);
      if (result.error) {
        this.$store.commit('addAlert', {
          text: `archiveOrRestoreSubrecipient Error (${result.status}): ${result.error}`,
          level: 'err',
        });
      } else {
        this.recipients = this.recipients.map((recipient) => (recipient.id === id ? result.recipient : recipient));
      }

      this.loading = false;
    },

    async loadRecipients() {
      this.loading = true;

      const result = await getJson('/api/subrecipients');
      if (result.error) {
        this.$store.commit('addAlert', {
          text: `loadRecipients Error (${result.status}): ${result.error}`,
          level: 'err',
        });
      } else {
        this.recipients = result.recipients;
      }

      this.loading = false;
    },
  },
};
</script>

<style scoped>
  .strikethrough {
    text-decoration: line-through;
  }
</style>

<!-- NOTE: This file was copied from src/views/Subrecipients.vue (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z -->
