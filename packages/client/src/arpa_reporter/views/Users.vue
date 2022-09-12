<template>
  <div>
    <h2>Users</h2>
    <div class="mb-4">
      <router-link to="/users/new" class="btn btn-primary">
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
      styleClass="vgt-table table table-striped table-bordered"
      >
      <div slot="emptystate">
        No Users
      </div>

      <template slot="table-row" slot-scope="props">
        <span v-if="props.column.field === 'edit'">
          <router-link tag="button" :to="`/users/${props.row.id}`" class="btn btn-sm btn-secondary">Edit</router-link>
        </span>

        <span v-else-if="props.column.field === 'agency_id' && props.row.agency_id">
          {{ props.row.agency_name }} ({{ props.row.agency_code }})
        </span>

        <span v-else-if="props.column.field === 'role'">
          {{ props.row.role.name }}
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
  name: 'Users',
  data: function () {
    return {
      users: []
    }
  },
  computed: {
    columns: function () {
      return [
        {
          label: 'Email',
          field: 'email'
        },
        {
          label: 'Name',
          field: 'name'
        },
        {
          label: 'Role',
          field: 'role'
        },
        {
          label: 'Agency',
          field: 'agency_id'
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
          label: 'Edit',
          field: 'edit'
        }
      ]
    },
    // This is just a shim to populate the agency_name/agency_code fields which ARPA Reporter previously
    // included on user objects, but GOST does not.
    usersWithAgency: function () {
      return this.users.map(user => {
        const agencyId = user.agency_id
        const agency = this.$store.state.agencies.find(a => a.id === agencyId) || { name: 'Loading...', code: '???' }
        return { ...user, agency_name: agency.name, agency_code: agency.code }
      })
    }
  },
  methods: {
    loadUsers: async function (evt) {
      const result = await getJson('/api/users')
      if (result.error) {
        this.$store.commit('addAlert', {
          text: `loadUsers Error (${result.status}): ${result.error}`,
          level: 'err'
        })
      } else {
        this.users = result.users
      }

      this.loading = false
    }
  },
  mounted: async function () {
    this.loadUsers()
  },
  components: {
    VueGoodTable
  }
}
</script>

<!-- NOTE: This file was copied from src/views/Users.vue (git @ 26f71a0d6d) in the arpa-reporter repo on 2022-09-12T21:06:59.476Z -->
