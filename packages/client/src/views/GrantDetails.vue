<!-- eslint-disable max-len -->
<template>
  <div>
    Grant ID: {{this.$route.params.id}}
    <div v-if="loading">
      Loading...
    </div>
    <div v-if="!selectedGrant && !loading">
      No grant found
    </div>
    <div v-if="selectedGrant && !loading">
      <b-row class="mb-3 d-flex align-items-baseline">
        <b-col cols="8">
          <h1 class="mb-0 h2">{{ selectedGrant.title }}</h1>
        </b-col>
        <b-col cols="4" class="text-right">
          <b-button :href="`https://www.grants.gov/web/grants/view-opportunity.html?oppId=${selectedGrant.grant_id}`"
            target="_blank" rel="noopener noreferrer" variant="primary">
            <b-icon icon="box-arrow-up-right" aria-hidden="true" class="mr-2"></b-icon>View on Grants.gov
          </b-button>
        </b-col>
      </b-row>
      <p><span class="data-label">Valid from:</span> {{ new
          Date(selectedGrant.open_date).toLocaleDateString('en-US', { timeZone: 'UTC' })
      }}-{{ new
    Date(selectedGrant.close_date).toLocaleDateString('en-US', { timeZone: 'UTC' })
}}</p>
      <div v-for="field in dialogFields" :key="field">
        <p><span class="data-label">{{ titleize(field) }}:</span> {{ selectedGrant[field] }}</p>
      </div>
      <p>
        <span class="data-label">Category of Funding Activity:</span>
        {{ selectedGrant['funding_activity_categories']?.join(', ') }}
      </p>
      <p class="data-label">Description:</p>
      <div style="max-height: 170px; overflow-y: scroll">
        <div style="white-space: pre-line" v-html="selectedGrant.description"></div>
      </div>
      <br />
      <b-row class="ml-2 mb-2 d-flex align-items-baseline">
        <h2 class="h4">{{newTerminologyEnabled ? 'Team': 'Agency'}} Status</h2>
        <b-col class="text-right">
          <b-row v-if="!interested">
            <b-col cols="9">
              <b-form-select v-model="selectedInterestedCode">
                <b-form-select-option-group label="Interested">
                  <b-form-select-option v-for="code in interestedCodes.interested" :key="code.id" :value="code.id">
                    {{ code.name }}</b-form-select-option>
                </b-form-select-option-group>
                <b-form-select-option-group label="Applied">
                  <b-form-select-option v-for="code in interestedCodes.result" :key="code.id" :value="code.id">
                    {{ code.name }}</b-form-select-option>
                </b-form-select-option-group>
                <b-form-select-option-group label="Not Applying">
                  <b-form-select-option v-for="code in interestedCodes.rejections" :key="code.id" :value="code.id">
                    {{ code.name }}</b-form-select-option>
                </b-form-select-option-group>
              </b-form-select>
            </b-col>
            <b-button variant="outline-primary" @click="markGrantAsInterested">Submit</b-button>
          </b-row>
          <b-row v-if="interested && interested.interested_status_code !== 'Rejection'&& shouldShowSpocButton">
            <b-col>
              <b-button variant="primary" @click="generateSpoc">Generate SPOC</b-button>
            </b-col>
          </b-row>
        </b-col>
      </b-row>
      <br />
      <b-table :items="selectedGrant.interested_agencies" :fields="interestedAgenciesFields">
        <template #cell(actions)="row">
          <b-row
            v-if="(String(row.item.agency_id) === selectedAgencyId) || isAbleToUnmark(row.item.agency_id)">
            <b-button variant="outline-danger" class="mr-1 border-0" size="sm" @click="unmarkGrantAsInterested(row)">
              <b-icon icon="trash-fill" aria-hidden="true"></b-icon>
            </b-button>
          </b-row>
        </template>
      </b-table>
      <br />
      <b-row class="ml-2 mb-2 d-flex align-items-baseline">
        <h2 class="h4">Assigned {{newTerminologyEnabled ? 'Teams': 'Agencies'}}</h2>
          <v-select v-model="selectedAgencies" :options="agencies" :multiple="true" :close-on-select="false"
            :clear-on-select="false" :placeholder="`Select ${newTerminologyEnabled ? 'teams': 'agencies'}`" label="name" track-by="id"
            style="width: 300px; margin: 0 16px;" :show-labels="false"
          >
          </v-select>
          <b-button variant="outline-primary" @click="assignAgenciesToGrant">Assign</b-button>
      </b-row>
      <b-table :items="assignedAgencies" :fields="assignedAgenciesFields">
        <template #cell(actions)="row">
          <b-button variant="outline-danger" class="mr-1 border-0" size="sm" @click="unassignAgenciesToGrant(row)">
            <b-icon icon="trash-fill" aria-hidden="true"></b-icon>
          </b-button>
        </template>
      </b-table>
    </div>
</div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import { debounce } from 'lodash';
import { newTerminologyEnabled } from '@/helpers/featureFlags';
import { titleize } from '../helpers/form-helpers';

export default {
  props: {
    selectedGrant: Object,
  },
  data() {
    return {
      showDialog: false,
      dialogFields: ['grant_id', 'agency_code', 'award_ceiling', 'cfda_list', 'opportunity_category', 'bill'],
      orderBy: '',
      interestedAgenciesFields: [
        {
          key: 'agency_name',
          label: `${newTerminologyEnabled ? 'Team' : 'Agency'}`,
        },
        {
          key: 'agency_abbreviation',
          label: 'Abbreviation',
        },
        {
          label: 'Name',
          key: 'user_name',
        },
        {
          label: 'Email',
          key: 'user_email',
        },
        {
          label: 'Interested Code',
          key: 'interested_code_name',
        },
        {
          key: 'actions',
          label: 'Actions',
        },
      ],
      assignedAgenciesFields: [
        {
          key: 'name',
        },
        {
          key: 'abbreviation',
          label: 'Abbreviation',
        },
        {
          key: 'created_at',
        },
        {
          key: 'actions',
          label: 'Actions',
        },
      ],
      assignedAgencies: [],
      selectedAgencies: [],
      selectedInterestedCode: null,
      searchInput: null,
      debouncedSearchInput: null,
      loading: true,
    };
  },
  created() {
    // watch the params of the route to fetch the data again
    this.$watch(
      () => this.$route.params,
      () => {
        this.loading = true;
        this.fetchData().then(() => {
          this.loading = false;
        });
      },
      // fetch the data when the view is created and the data is
      // already being observed
      { immediate: true },
    );
  },
  computed: {
    ...mapGetters({
      agency: 'users/agency',
      selectedAgencyId: 'users/selectedAgencyId',
      agencies: 'agencies/agencies',
      currentTenant: 'users/currentTenant',
      users: 'users/users',
      interestedCodes: 'grants/interestedCodes',
      loggedInUser: 'users/loggedInUser',
      selectedAgency: 'users/selectedAgency',
      currentGrant: 'grants/currentGrant',
    }),
    alreadyViewed() {
      if (!this.selectedGrant) {
        return false;
      }
      return this.selectedGrant.viewed_by_agencies.find(
        (viewed) => viewed.agency_id.toString() === this.selectedAgencyId,
      );
    },
    shouldShowSpocButton() {
      return this.currentTenant.uses_spoc_process;
    },
    interested() {
      if (!this.selectedGrant) {
        return undefined;
      }
      return this.selectedGrant.interested_agencies.find(
        (interested) => interested.agency_id.toString() === this.selectedAgencyId,
      );
    },
    newTerminologyEnabled() {
      return newTerminologyEnabled();
    },
  },
  watch: {
    async selectedGrant() {
      this.showDialog = Boolean(this.selectedGrant);
      if (this.selectedGrant) {
        this.fetchAgencies();
        if (!this.alreadyViewed) {
          try {
            await this.markGrantAsViewed();
          } catch (e) {
            console.log(e);
          }
        }
        this.assignedAgencies = await this.getGrantAssignedAgencies({ grantId: this.selectedGrant.grant_id });
      }
    },
  },
  methods: {
    ...mapActions({
      markGrantAsViewedAction: 'grants/markGrantAsViewed',
      generateGrantForm: 'grants/generateGrantForm',
      markGrantAsInterestedAction: 'grants/markGrantAsInterested',
      unmarkGrantAsInterestedAction: 'grants/unmarkGrantAsInterested',
      getInterestedAgencies: 'grants/getInterestedAgencies',
      getGrantAssignedAgencies: 'grants/getGrantAssignedAgencies',
      assignAgenciesToGrantAction: 'grants/assignAgenciesToGrant',
      unassignAgenciesToGrantAction: 'grants/unassignAgenciesToGrant',
      fetchUsers: 'users/fetchUsers',
      fetchAgencies: 'agencies/fetchAgencies',
      fetchGrantDetails: 'grants/fetchGrantDetails',
    }),
    titleize,
    debounceSearchInput: debounce(function bounce(newVal) {
      this.debouncedSearchInput = newVal;
    }, 500),
    async markGrantAsViewed() {
      await this.markGrantAsViewedAction({ grantId: this.selectedGrant.grant_id, agencyId: this.selectedAgencyId });
    },
    async markGrantAsInterested() {
      if (this.selectedInterestedCode !== null) {
        await this.markGrantAsInterestedAction({
          grantId: this.selectedGrant.grant_id,
          agencyId: this.selectedAgencyId,
          interestedCode: this.selectedInterestedCode,
        });
      }
    },
    async unmarkGrantAsInterested(row) {
      await this.unmarkGrantAsInterestedAction({
        grantId: this.selectedGrant.grant_id,
        agencyIds: [row.item.agency_id],
        interestedCode: this.selectedInterestedCode,
      });
      this.selectedGrant.interested_agencies = await this.getInterestedAgencies({ grantId: this.selectedGrant.grant_id });
    },
    async assignAgenciesToGrant() {
      const agencyIds = this.selectedAgencies.map((agency) => agency.id);
      await this.assignAgenciesToGrantAction({
        grantId: this.selectedGrant.grant_id,
        agencyIds,
      });
      this.selectedAgencies = [];
      this.assignedAgencies = await this.getGrantAssignedAgencies({ grantId: this.selectedGrant.grant_id });
    },
    async unassignAgenciesToGrant(row) {
      await this.unassignAgenciesToGrantAction({
        grantId: this.selectedGrant.grant_id,
        agencyIds: [row.item.id],
      });
      this.assignedAgencies = await this.getGrantAssignedAgencies({ grantId: this.selectedGrant.grant_id });
    },
    async generateSpoc() {
      await this.generateGrantForm({
        grantId: this.selectedGrant.grant_id,
      });
    },
    isAbleToUnmark(agencyId) {
      return this.agencies.some((agency) => agency.id === agencyId);
    },
    resetSelectedGrant() {
      this.$emit('update:selectedGrant', null);
      this.assignedAgencies = [];
      this.selectedAgencies = [];
    },
    async fetchData() {
      await this.fetchGrantDetails({ grantId: this.$route.params.id }).then(() => {
        this.selectedGrant = this.currentGrant;
      });
    },
  },
};
</script>