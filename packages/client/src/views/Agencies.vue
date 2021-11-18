<template>
<section class="container-fluid">
  <b-row>
    <b-col><h2>Agencies</h2></b-col>
    <b-col></b-col>
  </b-row>
  <b-table sticky-header="600px" hover :items="formattedAgencies" :fields="fields">
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
</section>
</template>

<script>

import { mapActions, mapGetters } from 'vuex';

import EditAgencyModal from '@/components/Modals/EditAgency.vue';

export default {
  components: {
    EditAgencyModal,
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
        { key: 'actions', label: 'Actions' },
      ],
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
  },
};
</script>
