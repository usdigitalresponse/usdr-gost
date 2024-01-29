<!-- eslint-disable max-len -->
<template>
  <section class="container-fluid grants-details-container">
    <b-breadcrumb>
        <b-breadcrumb-item href="/#/grants">Home</b-breadcrumb-item>
     	<b-breadcrumb-item active>{{ selectedGrant.title }}</b-breadcrumb-item>
    </b-breadcrumb>
  <div>
    <div v-if="loading">
      Loading...
    </div>
    <div v-if="!selectedGrant && !loading">
      No grant found
    </div>
    <div v-if="selectedGrant && !loading" class="mb-3 d-flex align-items-start">
      <b-col class="mx-4">
          <h1 class="mb-0 h2">{{ selectedGrant.title }}</h1>
          <table class="table table-striped table-responsive-md mr-5 mt-5">
          <tbody>
            <tr>
                  <th>Opportunity Number</th>
                  <td>{{ selectedGrant.grant_number }}</td>
            </tr>
            <tr>
                  <th>Open Date</th>
                  <td>{{ formatDate(selectedGrant.open_date) }}</td>
            </tr>
            <tr>
                  <th>Close Date</th>
                  <td>{{ formatDate(selectedGrant.close_date) }}</td>
            </tr>
             <tr>
                  <th>Grant ID</th>
                  <td>{{ selectedGrant.grant_id }}</td>
            </tr>
            <tr>
                  <th>Federal Awarding Agency Code</th>
                  <td>{{ selectedGrant.agency_code }}</td>
            </tr>
            <tr>
                  <th>Award Ceiling</th>
                  <td>{{ selectedGrant.award_ceiling }}</td>
            </tr>
            <tr>
                  <th>Category of Funding Activity</th>
                  <td>{{ selectedGrant['funding_activity_categories']?.join(', ') }}</td>
            </tr>
            <tr>
                  <th>Opportunity Category</th>
                  <td>{{ selectedGrant.opportunity_category }}</td>
            </tr>
            <tr>
                  <th>Opportunity Status</th>
                  <td>{{ selectedGrant.opportunity_status }}</td>
            </tr>
            <tr>
                  <th>Appropriation Bill</th>
                  <td>{{ selectedGrant.bill }}</td>
            </tr>
            <tr>
                  <th>Cost Sharing</th>
                  <td>{{ selectedGrant.cost_sharing }}</td>
            </tr>
           </tbody>
        </table>
      <p class="data-label">Description:</p>
        <div style="white-space: pre-line" v-html="selectedGrant.description"></div>
      <br />

      </b-col>
      <b-col class="mx-auto my-5 px-2 col-md-4 col-lg-3">
        <b-row>
          <b-button :href="`https://www.grants.gov/web/grants/view-opportunity.html?oppId=${selectedGrant.grant_id}`"
            target="_blank" rel="noopener noreferrer" variant="primary" class="btn-block mx-1 my-2" data-dd-action-name="view on grants.gov">
            <b-icon icon="box-arrow-up-right" aria-hidden="true" class="mr-2"></b-icon>Apply on Grants.gov
          </b-button>
          <b-button target="_blank" rel="noopener noreferrer" variant="outline-primary" class="col mx-1" @click="printPage">
            <b-icon icon="printer-fill" aria-hidden="true" class="mr-2"></b-icon>Print
          </b-button>
          <b-button target="_blank" rel="noopener noreferrer" variant="outline-primary" class="col mx-1" @click="copyUrl">
            <!-- fixme: figure out why the copy icon doesn't work here -->
            <b-icon icon="front" aria-hidden="true" class="mr-2"></b-icon>Copy Link
          </b-button>
          </b-row>
      <br />
        <b-row class="mt-4">
        <h4>Assign Grant</h4>
        </b-row>
        <b-row>
          <b-col>
            <v-select v-model="selectedAgencies" :options="agencies" :multiple="true"
              label="name" track-by="id"
              :placeholder="`Choose ${newTerminologyEnabled ? 'team': 'agency'}`"
              data-dd-action-name="select team for grant assignment"
            >
            </v-select>
          </b-col>
          <b-col>
          <b-button variant="primary" @click="assignAgenciesToGrant" data-dd-action-name="assign team">Submit</b-button>
          </b-col>
        </b-row>
        <b-row>
            <div v-for="agency in assignedAgencies" :key="agency">
            <p>
              <span>{{ agency.name }} </span>
              <button type="button" class="btn btn-close" @click="unassignAgenciesToGrant(agency)"
                data-dd-action-name="remove team assignment"><b-icon icon="x" aria-hidden="true"></b-icon></button>
            </p>
            </div>
        </b-row>
        <b-row>
        <h4>{{newTerminologyEnabled ? 'Team': 'Agency'}} Status</h4>
        </b-row>
        <b-row>
            <b-col>
             <b-form-select v-model="selectedInterestedCode" data-dd-action-name="select team status">
                <b-form-select-option :value="null">Choose Status</b-form-select-option>
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
<b-col>
          <b-button variant="primary" @click="markGrantAsInterested" data-dd-action-name="submit team status">Submit</b-button>
          </b-col>
          </b-row>
          <b-row>
            <div v-for="agency in selectedGrant.interested_agencies" :key="agency">
                <p v-if="(String(agency.agency_id) === selectedAgencyId) || isAbleToUnmark(agency.agency_id)">
                    <span class="data-label">{{ agency.user_name }}</span>
                    <span> updated </span>
                    <span class="data-label">{{ agency.agency_name }}</span>
                    <span> team status to </span>
                    <span class="data-label">{{ agency.interested_code_name }}</span>
                    <button type="button" class="btn btn-close"
                       @click="unmarkGrantAsInterested(agency)" data-dd-action-name="remove team status">
                       <b-icon icon="x" aria-hidden="true"></b-icon>
                    </button>
                </p>
              </div>
          </b-row>
      </b-col>
    </div>
</div>
</section>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import { datadogRum } from '@datadog/browser-rum';
import { debounce } from 'lodash';
import { newTerminologyEnabled } from '@/helpers/featureFlags';
import { DateTime } from 'luxon';

export default {
  props: {
    selectedGrant: Object,
  },
  data() {
    return {
      showDialog: false,
      orderBy: '',
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
        datadogRum.addAction('submit team status for grant', { team: { id: this.selectedAgencyId }, status: this.selectedInterestedCode, grant: { id: this.selectedGrant.grant_id } });
      }
    },
    async unmarkGrantAsInterested(agency) {
      await this.unmarkGrantAsInterestedAction({
        grantId: this.selectedGrant.grant_id,
        agencyIds: [agency.agency_id],
        interestedCode: this.selectedInterestedCode,
      });
      this.selectedGrant.interested_agencies = await this.getInterestedAgencies({ grantId: this.selectedGrant.grant_id });
      datadogRum.addAction('remove team status for grant', { team: { id: this.selectedAgencyId }, status: this.selectedInterestedCode, grant: { id: this.selectedGrant.grant_id } });
    },
    async assignAgenciesToGrant() {
      const agencyIds = this.selectedAgencies.map((agency) => agency.id);
      await this.assignAgenciesToGrantAction({
        grantId: this.selectedGrant.grant_id,
        agencyIds,
      });
      this.selectedAgencies = [];
      this.assignedAgencies = await this.getGrantAssignedAgencies({ grantId: this.selectedGrant.grant_id });
      datadogRum.addAction('assign team to grant', { team: { id: this.selectedAgencyId }, grant: { id: this.selectedGrant.grant_id } });
    },
    async unassignAgenciesToGrant(agency) {
      await this.unassignAgenciesToGrantAction({
        grantId: this.selectedGrant.grant_id,
        agencyIds: [agency.id],
      });
      this.assignedAgencies = await this.getGrantAssignedAgencies({ grantId: this.selectedGrant.grant_id });
      datadogRum.addAction('remove team assignment from grant', { team: { id: this.selectedAgencyId }, grant: { id: this.selectedGrant.grant_id } });
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
    copyUrl() {
      // fixme: make sure this works in the browsers we need to support
      navigator.clipboard.writeText(window.location.href);
    },
    printPage() {
      window.print();
    },
    formatDate(dateString) {
      return DateTime.fromISO(dateString).toLocaleString(DateTime.DATE_MED);
    },
  },
};
</script>
<style>
  .breadcrumb {
    background-color: #ffffff;
  }
  .grants-details-container {
    padding: 80px;
  }

  .grants-details-container th {
    font-weight: normal;
  }

  .grants-details-container td {
    font-weight: bold;
  }
</style>
