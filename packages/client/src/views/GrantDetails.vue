<template>
  <section class="container-fluid grants-details-container">
    <div>
      <div v-if="loading">
        Loading...
      </div>
      <div v-if="!selectedGrant && !loading">
        No grant found
      </div>
      <b-container fluid v-if="selectedGrant && !loading" class="mt-5">
        <b-row>
          <!-- Left page column: title, table data, and grant description -->
          <b-col>
            <h2 class="mb-5">{{ selectedGrant.title }}</h2>
            <b-table
              class="grant-details-table mb-5"
              :items="tableData"
              :fields="[
                {key: 'name', class: 'color-gray grants-details-table-fit-content'},
                {key: 'value', class: 'font-weight-bold'},
              ]"
              thead-class="d-none"
              borderless
              hover
            ></b-table>
            <h3 class="mb-3">Description</h3>
            <!-- TODO: spike on removing v-html usage https://github.com/usdigitalresponse/usdr-gost/issues/2572 -->
            <div style="white-space: pre-line" v-html="selectedGrant.description"></div>
          </b-col>

          <!-- Right page column: apply, assign, and status actions -->
          <b-col class="grants-details-sidebar">

            <!-- Main action buttons section -->
            <div class="mb-5">
              <b-button
                size="lg"
                variant="primary"
                block
                class="mb-3"
                :href="`https://www.grants.gov/search-results-detail/${selectedGrant.grant_id}`"
                target="_blank"
                rel="noopener noreferrer"
                data-dd-action-name="view on grants.gov"
              >
                <b-icon icon="box-arrow-up-right" aria-hidden="true" class="mr-2" />
                Apply on Grants.gov
              </b-button>
              <div class="d-flex">
                <b-button
                  class="w-50 flex-shrink-1 mr-3"
                  variant="outline-primary"
                  @click="printPage"
                >
                  <b-icon icon="printer-fill" aria-hidden="true" class="mr-2" />
                  Print
                </b-button>
                <b-button
                  class="w-50 flex-shrink-1"
                  variant="outline-primary"
                  @click="copyUrl"
                >
                  <b-icon icon="files" aria-hidden="true" class="mr-2" />
                  Copy Link
                </b-button>
              </div>
            </div>

            <!-- Assign grant section -->
            <div class="mb-5">
              <h4 class="mb-3">Assign Grant</h4>
              <div class="d-flex">
                <v-select
                  class="flex-grow-1 mr-3"
                  v-model="selectedAgencies"
                  :options="agencies"
                  :multiple="true"
                  label="name" track-by="id"
                  :placeholder="`Choose ${newTerminologyEnabled ? 'team': 'agency'}`"
                  data-dd-action-name="select team for grant assignment"
                />
                <b-button variant="primary" @click="assignAgenciesToGrant" data-dd-action-name="assign team">
                  Submit
                </b-button>
              </div>
              <div v-for="agency in assignedAgencies" :key="agency.id" class="d-flex justify-content-between align-items-start my-3">
                <div class="mr-3">
                  <p class="m-0">{{ agency.name }}</p>
                  <p class="m-0 text-muted"><small>{{ agency.created_at }}</small></p>
                </div>
                <b-button-close
                  @click="unassignAgenciesToGrant(agency)"
                  data-dd-action-name="remove team assignment"
                />
              </div>
            </div>

            <!-- Team status section -->
            <div class="mb-5">
              <h4 class="mb-3">{{newTerminologyEnabled ? 'Team': 'Agency'}} Status</h4>
              <div class="d-flex">
                <b-form-select
                  class="flex-grow-1 mr-3"
                  v-model="selectedInterestedCode"
                  data-dd-action-name="select team status"
                >
                  <b-form-select-option :value="null">Choose Status</b-form-select-option>
                  <b-form-select-option-group label="Interested">
                    <b-form-select-option v-for="code in interestedCodes.interested" :key="code.id" :value="code.id">
                      {{ code.name }}
                    </b-form-select-option>
                  </b-form-select-option-group>
                  <b-form-select-option-group label="Applied">
                    <b-form-select-option v-for="code in interestedCodes.result" :key="code.id" :value="code.id">
                      {{ code.name }}
                    </b-form-select-option>
                  </b-form-select-option-group>
                  <b-form-select-option-group label="Not Applying">
                    <b-form-select-option v-for="code in interestedCodes.rejections" :key="code.id" :value="code.id">
                      {{ code.name }}
                    </b-form-select-option>
                  </b-form-select-option-group>
                </b-form-select>
                <b-button variant="primary" @click="markGrantAsInterested" data-dd-action-name="submit team status">
                  Submit
                </b-button>
              </div>
              <div v-for="agency in visibleInterestedAgencies" :key="agency.id" class="d-flex justify-content-between align-items-start my-3">
                <!-- TODO: adopt updated design for what to show on each line item here -->
                <div>
                  <p class="m-0">
                    <strong>{{ agency.user_name }}</strong> updated
                    <strong>{{ agency.agency_name }}</strong> team status to
                    <strong>{{ agency.interested_code_name }}</strong>
                  </p>
                </div>
                <b-button-close
                  @click="unmarkGrantAsInterested(agency)"
                  data-dd-action-name="remove team status"
                />
              </div>
            </div>

          </b-col>
        </b-row>
      </b-container>
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
    tableData() {
      return [{
        name: 'Opportunity Number',
        value: this.selectedGrant.grant_number,
      }, {
        name: 'Open Date',
        value: this.formatDate(this.selectedGrant.open_date),
      }, {
        name: 'Close Date',
        value: this.formatDate(this.selectedGrant.close_date),
      }, {
        name: 'Grant ID',
        value: this.selectedGrant.grant_id,
      }, {
        name: 'Federal Awarding',
        value: this.selectedGrant.agency_code,
      }, {
        name: 'Award Ceiling',
        value: this.selectedGrant.award_ceiling,
      }, {
        name: 'Category of',
        value: this.selectedGrant.funding_activity_categories?.join(', '),
      }, {
        name: 'Opportunity Category',
        value: this.selectedGrant.opportunity_category,
      }, {
        name: 'Opportunity Status',
        value: this.selectedGrant.opportunity_status,
      }, {
        name: 'Appropriation Bill',
        value: this.selectedGrant.bill,
      }, {
        name: 'Cost Sharing',
        value: this.selectedGrant.cost_sharing,
      },
      ];
    },
    visibleInterestedAgencies() {
      return this.selectedGrant.interested_agencies
        .filter((agency) => String(agency.agency_id) === this.selectedAgencyId || this.isAbleToUnmark(agency.agency_id));
    },
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

<style lang="css">
.grants-details-sidebar {
  flex-basis: 500px;
  flex-grow: 0;
}
.grant-details-table tr:nth-of-type(odd) {
  /* Design color differs from default bootstrap, so making our own striped background here */
  background-color: #F9F9F9;
}
.grants-details-table-fit-content {
  /* Make a table column that's the width of its content */
  white-space: nowrap;
  width: 1%;
}
</style>
