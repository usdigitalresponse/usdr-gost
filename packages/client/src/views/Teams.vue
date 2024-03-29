<template>
  <section class="container-fluid">
    <b-row>
      <b-col class="m-2">
        <h2 class="h4">
          {{ newTerminologyEnabled ? 'Teams' : 'Agencies' }}
        </h2>
      </b-col>
      <b-col />
      <b-col
        v-if="userRole === 'admin'"
        class="d-flex justify-content-end"
      >
        <div>
          <b-button
            id="addTeamButton"
            class="mr-1"
            variant="primary"
            size="sm"
            @click="openAddTeamModal"
          >
            Add
          </b-button>
        </div>
        <div>
          <b-button
            id="bulkTeamImportButton"
            variant="outline-primary"
            size="sm"
            @click="openUploadTeamsModal"
          >
            Bulk Import
          </b-button>
        </div>
      </b-col>
    </b-row>
    <b-table
      sticky-header="600px"
      hover
      :items="formattedTeams"
      :fields="fields"
    >
      <template #cell(name)="row">
        {{ row.item.name }}
      </template>
      <template #cell(warning_threshold)="row">
        {{ row.item.warning_threshold }} days
      </template>
      <template #cell(danger_threshold)="row">
        {{ row.item.danger_threshold }} days
      </template>
      <template #cell(actions)="row">
        <b-button
          v-if="userRole === 'admin'"
          class="mr-1 border-0"
          size="sm"
          variant="outline-primary"
          @click="openEditTeamModal(row.item)"
        >
          <b-icon
            icon="pencil-fill"
            aria-hidden="true"
          />
        </b-button>
      </template>
    </b-table>
    <EditTeamModal
      :show.sync="showEditTeamModal"
      :agency="editingTeam"
    />
    <AddTeamModal :show.sync="showAddTeamModal" />
    <ImportTeamsModal :show.sync="showUploadTeamsModal" />
  </section>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import EditTeamModal from '@/components/Modals/EditTeam.vue';
import AddTeamModal from '@/components/Modals/AddTeam.vue';
import ImportTeamsModal from '@/components/Modals/ImportTeams.vue';
import { newTerminologyEnabled } from '@/helpers/featureFlags';

export default {
  components: {
    EditTeamModal,
    AddTeamModal,
    ImportTeamsModal,
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
  computed: {
    ...mapGetters({
      teams: 'agencies/agencies',
      userRole: 'users/userRole',
      selectedTeam: 'users/selectedAgency',
    }),
    newTerminologyEnabled() {
      return newTerminologyEnabled();
    },
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
  mounted() {
    this.setup();
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
