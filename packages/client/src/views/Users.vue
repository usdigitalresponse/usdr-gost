<template>
<section class="container-fluid">
  <b-row>
    <b-col><h2>Users</h2></b-col>
    <b-col></b-col>
    <b-col>
        <b-button variant="success" @click="openAddUserModal">Add</b-button>
    </b-col>
  </b-row>
  <b-table sticky-header="600px" hover :items="formattedUsers" :fields="fields">
    <template #cell(actions)="row">
        <b-button variant="danger" class="mr-1" size="sm" @click="deleteUser(row.item.id)">
          <b-icon icon="trash-fill" aria-hidden="true"></b-icon>
        </b-button>
      </template>
  </b-table>
  <AddUserModal :showModal.sync="showAddUserModal"/>
</section>
</template>

<script>

import { mapActions, mapGetters } from 'vuex';

import AddUserModal from '@/components/Modals/AddUser.vue';

export default {
  components: {
    AddUserModal,
  },
  data() {
    return {
      fields: [
        {
          key: 'email',
          sortable: true,
        },
        {
          key: 'name',
        },
        {
          key: 'role',
          sortable: true,
        },
        {
          key: 'agency',
          sortable: true,
        },
        {
          key: 'created_at',
        },
        { key: 'actions', label: 'Actions' },
      ],
      showAddUserModal: false,
    };
  },
  mounted() {
    this.fetchUsers();
  },
  computed: {
    ...mapGetters({
      users: 'users/users',
    }),
    formattedUsers() {
      return this.users.map((user) => ({
        ...user,
        agency: user.agency.name,
        role: user.role.name,
      }));
    },
  },
  methods: {
    ...mapActions({
      fetchUsers: 'users/fetchUsers',
      deleteUser: 'users/deleteUser',
    }),
    openAddUserModal() {
      this.showAddUserModal = true;
    },
  },
};
</script>
