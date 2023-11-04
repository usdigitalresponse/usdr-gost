<template>
<section class="container-fluid">
  <b-row>
    <b-col><h2>Teams</h2></b-col>
    <b-col></b-col>
    <b-col class="d-flex justify-content-end" v-if="userRole === 'admin'">
      <div>
        <b-button id="bulkTeamImportButton" variant="success" @click="openUploadTeamsModal" class="mr-1">Bulk Import</b-button>
      </div>
      <div>
        <b-button id="addTeamButton" variant="success" @click="openAddTeamModal">Add</b-button>
      </div>
    </b-col>
  </b-row>
  <b-table sticky-header="600px" hover :items="formattedTeams" :fields="fields">
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
      <b-button v-if="userRole === 'admin'" class="mr-1" size="sm" @click="openEditTeamModal(row.item)">
        <b-icon icon="pencil-fill" aria-hidden="true"></b-icon>
      </b-button>
    </template>
  </b-table>
  <EditAgencyModal :agency.sync="editingTeam"/>
  <AddAgencyModal :showDialog.sync="showAddTeamModal"/>
  <ImportAgenciesModal :showUploadModal.sync="showUploadTeamsModal" :importStatus="'Nothing imported yet.'"/>
</section>
</template>

<script>

import { mapActions, mapGetters } from 'vuex';

import EditAgencyModal from '@/components/Modals/EditAgency.vue';
import AddAgencyModal from '@/components/Modals/AddAgency.vue';
import ImportAgenciesModal from '@/components/Modals/ImportAgencies.vue';

export default {
  components: {
    EditAgencyModal,
    AddAgencyModal,
    ImportAgenciesModal,
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
          key: 'code',
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
      showAddTeamModal: false,
      showEditTeamModal: false,
      showUploadTeamsModal: false,
      editingTeam: null,
    };
  },
  mounted() {
    this.setup();
  },
  computed: {
    ...mapGetters({
      teams: 'agencies/agencies',
      userRole: 'users/userRole',
      selectedTeam: 'users/selectedAgency',
    }),
    formattedTeams() {
      return this.teams.map((team) => ({
        ...team,
      }));
    },
  },
  watch: {
    selectedTeam() {
      this.setup();
    },
  },
  methods: {
    ...mapActions({
      fetchTeams: 'agencies/fetchAgencies',
    }),
    setup() {
      this.fetchTeams();
    },
    openEditTeamModal(team) {
      this.editingTeam = team;
      this.showEditTeamModal = true;
    },
    openAddTeamModal() {
      this.showAddTeamModal = true;
    },
    openUploadTeamsModal() {
      this.showUploadTeamsModal = true;
    },
  },
};
</script>
