<template>
<section class="container-fluid">
  <b-row>
    <b-col><h2>Agencies</h2></b-col>
    <b-col></b-col>
    <b-col class="d-flex justify-content-end" v-if="userRole === 'admin'">
      <div>
        <b-button variant="success" @click="openAddAgencyModal">Add</b-button>
      </div>
    </b-col>
  </b-row>
  <b-table sticky-header="600px" hover :items="formattedAgencies" :fields="fields">
    <template #cell(name)="row">
        {{row.item.name}}
      </template>
      <template #cell(warning_threshold)="row">
        {{row.item.warning_threshold}} days
      </template>
      <template #cell(danger_threshold)="row">
        {{row.item.danger_threshold}} days
      </template>
      <template #cell(actions)="row">
      <b-button v-if="userRole === 'admin'" class="mr-1" size="sm" @click="openEditAgencyModal(row.item)">
        <b-icon icon="pencil-fill" aria-hidden="true"></b-icon>
      </b-button>
    </template>
  </b-table>
  <EditAgencyModal
     :agency.sync="editingAgency"
  />
  <AddAgencyModal
  :showDialog.sync="showAddAgencyModal"/>
</section>
</template>

<script>

import { mapActions, mapGetters } from 'vuex';

import EditAgencyModal from '@/components/Modals/EditAgency.vue';
import AddAgencyModal from '@/components/Modals/AddAgency.vue';

export default {
  components: {
    EditAgencyModal,
    AddAgencyModal,
  },
  data() {
    return {
      fields: [
        {
          key: 'name',
          sortable: true,
        },
        {
          key: 'abbreviation',
          sortable: true,
        },
        {
          key: 'warning_threshold',
          label: 'Close Date Warning Threshold',
          sortable: true,
        },
        {
          key: 'danger_threshold',
          label: 'Close Date Danger Threshold',
          sortable: true,
        },
        {
          key: 'actions',
          label: 'Actions',
        },
      ],
      showAddAgencyModal: false,
      showEditAgencyModal: false,
      editingAgency: null,
    };
  },
  mounted() {
    this.setup();
  },
  computed: {
    ...mapGetters({
      agencies: 'agencies/agencies',
      userRole: 'users/userRole',
      selectedAgency: 'users/selectedAgency',
    }),
    formattedAgencies() {
      return this.agencies.map((agency) => ({
        ...agency,
      }));
    },
  },
  watch: {
    selectedAgency() {
      this.setup();
    },
  },
  methods: {
    ...mapActions({
      fetchAgencies: 'agencies/fetchAgencies',
    }),
    setup() {
      this.fetchAgencies();
    },
    openEditAgencyModal(agency) {
      this.editingAgency = agency;
      this.showEditAgencyModal = true;
    },
    openAddAgencyModal() {
      this.showAddAgencyModal = true;
    },
  },
};
</script>
