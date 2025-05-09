<template>
  <div>
    <h1>Users</h1>
    <div class="mb-4">
      <router-link
        to="/users/new"
        class="btn usdr-btn-primary"
      >
        Create New User
      </router-link>
    </div>

    <vue-good-table
      :columns="columns"
      :rows="usersWithAgency"
      :search-options="{
        enabled: true,
        placeholder: 'Filter users...'
      }"
      style-class="vgt-table table table-striped table-bordered"
    >
      <template #emptystate>
        No Users
      </template>

      <template #table-row="props">
        <span v-if="props.column.field === 'edit'">
          <router-link
            tag="button"
            :to="`/users/${props.row.id}`"
            class="btn btn-sm btn-secondary"
          >Edit</router-link>
        </span>

        <span v-else-if="props.column.field === 'agency_id' && props.row.agency_id">
          {{ props.row.agency_name }} ({{ props.row.agency_code }})
        </span>

        <span v-else-if="props.column.field === 'role'">
          {{ props.row.role.name }}
        </span>

        <span v-else>
          {{ props.formattedRow[props.column.field] }}
        </span>
      </template>
    </vue-good-table>
  </div>
</template>

<script>
import moment from 'moment';
import 'vue-good-table/dist/vue-good-table.css';
import { VueGoodTable } from 'vue-good-table';

import { getJson } from '@/arpa_reporter/store';

export default {
  name: 'UsersView',
  components: {
    VueGoodTable,
  },
  data() {
    return {
      users: [],
    };
  },
  computed: {
    columns() {
      return [
        {
          label: 'Email',
          field: 'email',
        },
        {
          label: 'Name',
          field: 'name',
        },
        {
          label: 'Role',
          field: 'role',
        },
        {
          label: 'Agency',
          field: 'agency_id',
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
          label: 'Edit',
          field: 'edit',
        },
      ];
    },
    // This is just a shim to populate the agency_name/agency_code fields which ARPA Reporter previously
    // included on user objects, but GOST does not.
    usersWithAgency() {
      return this.users.map((user) => {
        const agencyId = user.agency_id;
        const agency = this.$store.state.agencies.find((a) => a.id === agencyId) || { name: 'Loading...', code: '???' };
        return { ...user, agency_name: agency.name, agency_code: agency.code };
      });
    },
  },
  async mounted() {
    this.loadUsers();
  },
  methods: {
    async loadUsers() {
      const result = await getJson('/api/users');
      if (result.error) {
        this.$store.commit('addAlert', {
          text: `loadUsers Error (${result.status}): ${result.error}`,
          level: 'err',
        });
      } else {
        this.users = result.users;
      }

      this.loading = false;
    },
  },
};
</script>

<!-- NOTE: This file was copied from src/views/Users.vue (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z -->
