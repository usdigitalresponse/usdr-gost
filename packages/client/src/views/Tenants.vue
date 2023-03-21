<template>
<section class="container-fluid">
  <b-row>
    <b-col><h2>Tenants</h2></b-col>
    <b-col></b-col>
    <b-col class="d-flex justify-content-end">
      <div>
        <b-button variant="success" @click="openAddTenantModal">Add</b-button>
      </div>
    </b-col>
  </b-row>
  <b-table sticky-header="600px" hover :items="formattedTenants" :fields="fields">
      <template #cell(display_name)="row">
        {{row.item.display_name}}
      </template>
      <template #cell(actions)="row">
      <b-button class="mr-1" size="sm" @click="openEditTenantModal(row.item)">
        <b-icon icon="pencil-fill" aria-hidden="true"></b-icon>
      </b-button>
    </template>
  </b-table>
  <EditTenantModal
     :tenant.sync="editingTenant"
  />
  <AddTenantModal :showModal.sync="showAddTenantModal"/>
</section>
</template>

<script>

import { mapActions, mapGetters } from 'vuex';

import EditTenantModal from '@/components/Modals/EditTenant.vue';
import AddTenantModal from '@/components/Modals/AddTenants.vue';

export default {
  components: {
    EditTenantModal,
    AddTenantModal,
  },
  data() {
    return {
      fields: [
        { key: 'id', sortable: true, label: 'ID' },
        {
          key: 'display_name',
          sortable: true,
        },
        { key: 'actions', label: 'Actions' },
      ],
      showEditTenantModal: false,
      showAddTenantModal: false,
      editingTenant: null,
    };
  },
  mounted() {
    this.setup();
  },
  computed: {
    ...mapGetters({
      tenants: 'tenants/tenants',
      userRole: 'users/userRole',
      selectedAgency: 'users/selectedAgency',
    }),
    formattedTenants() {
      return this.tenants.map((tenant) => ({
        ...tenant,
      }));
    },
  },
  watch: {
    selectedAgency() {
      this.setup();
    },
    showModal() {
      this.$bvModal.show('add-tenant-modal');
    },
  },
  methods: {
    ...mapActions({
      fetchTenants: 'tenants/fetchTenants',
    }),
    setup() {
      this.fetchTenants();
    },
    openEditTenantModal(tenant) {
      this.editingTenant = tenant;
      this.showEditTenantModal = true;
    },
    openAddTenantModal() {
      this.showAddTenantModal = true;
    },
  },
};
</script>
