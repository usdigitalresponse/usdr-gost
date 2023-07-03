<template>
  <section class="container-fluid">
    <b-row class="mt-3 mb-3" align-h="between">
      <b-col cols="5">
        <b-input-group size="md">
          <b-input-group-text>
            <b-icon icon="search" />
          </b-input-group-text>
          <b-form-input type="sliders" @input="debounceSearchInput"></b-form-input>
        </b-input-group>
      </b-col>
      <b-col class="d-flex justify-content-end">
        <SearchPanel />
        <SavedSearchPanel />
        <b-button @click="exportCSV" :disabled="loading" variant="outline-secondary">
          <b-icon icon="download" class="mr-1 mb-1" font-scale="0.9" aria-hidden="true" />
          Export to CSV
        </b-button>
      </b-col>
    </b-row>
    <b-row>
      <b-col cols="12">
        <SearchFilter :filterKeys="searchFilters" />
      </b-col>
    </b-row>
    <b-row class="mt-3 mb-3" align-h="start" style="position: relative; z-index: 999">
      <b-col v-if="!showInterested && !showRejected && !showResult && !showAssignedToAgency" cols="3">
        <multiselect v-model="reviewStatusFilters" :options="reviewStatusOptions" :multiple="true"
          :close-on-select="false" :clear-on-select="false" placeholder="Review Status" :show-labels="false">
        </multiselect>
      </b-col>
      <b-col cols="3">
        <multiselect v-model="opportunityStatusFilters" :options="opportunityStatusOptions" :multiple="true"
                     :close-on-select="false" :clear-on-select="false" placeholder="Opportunity Status" :show-labels="false">
        </multiselect>
      </b-col>
      <b-col cols="3">
        <multiselect v-model="opportunityCategoryFilters" :options="opportunityCategoryOptions" :multiple="true"
                     :close-on-select="false" :clear-on-select="false" placeholder="Opportunity Category" :show-labels="false">
        </multiselect>
      </b-col>
      <b-col cols="2">
        <multiselect v-model="costSharingFilter" :options="costSharingOptions" :multiple="false"
                     :close-on-select="true" :clear-on-select="false" placeholder="Cost Sharing" :show-labels="false">
        </multiselect>
      </b-col>
    </b-row>
    <b-table id="grants-table" sticky-header="600px" hover :items="formattedGrants" :fields="fields.filter( field => !field.hideGrantItem)" selectable striped
      :sort-by.sync="orderBy" :sort-desc.sync="orderDesc" :no-local-sorting="true"
      select-mode="single" :busy="loading" @row-selected="onRowSelected">
      <template #cell(award_floor)="row">
        <p> {{ formatMoney(row.item.award_floor) }}</p>
      </template>
      <template #cell(award_ceiling)="row">
        <p> {{ formatMoney(row.item.award_ceiling) }}</p>
      </template>
      <template #table-busy>
        <div class="text-center text-danger my-2">
          <b-spinner class="align-middle"></b-spinner>
          <strong> Loading...</strong>
        </div>
      </template>
    </b-table>
    <b-row align-v="center">
      <b-pagination class="m-0" v-model="currentPage" :total-rows="totalRows" :per-page="perPage" first-number
        last-number first-text="First" prev-text="Prev" next-text="Next" last-text="Last"
        aria-controls="grants-table" />
      <b-button class="ml-2" variant="outline-primary disabled">{{ grants.length }} of {{ totalRows }}</b-button>
    </b-row>
    <GrantDetails :selected-grant.sync="selectedGrant" />
  </section>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import { debounce } from 'lodash';
import Multiselect from 'vue-multiselect';
import { titleize } from '../helpers/form-helpers';
import GrantDetails from './Modals/GrantDetails.vue';
import SearchPanel from './Modals/SearchPanel.vue';
import SavedSearchPanel from './Modals/SavedSearchPanel.vue';
import SearchFilter from './SearchFilter.vue';

export default {
  components: {
    GrantDetails, Multiselect, SearchPanel, SavedSearchPanel, SearchFilter,
  },
  props: {
    showMyInterested: Boolean,
    showInterested: Boolean,
    showRejected: Boolean,
    showResult: Boolean,
    showAging: Boolean,
    showAssignedToAgency: String,
    hideGrantItems: Boolean,
  },
  data() {
    return {
      perPage: 50,
      currentPage: 1,
      loading: false,
      searchFilters: [
        {
          label: 'Include',
          value: ['Nevada', 'infrastructure'],
        },
        {
          label: 'Exclude',
          value: ['road', 'highways'],
        },
        {
          label: 'Opp Status',
          value: ['forecasted', 'posted'],
        },
        {
          label: 'Cost Sharing',
          value: 'Yes',
        },
        {
          label: 'Review Status',
          value: ['Interested', 'Supporting'],
        },
      ],
      fields: [
        {
          key: 'grant_number',
          label: 'Opportunity Number',
          variant: 'dark',
          stickyColumn: true, // was in the grant id col but not sure if necessary
          hideGrantItem: this.hideGrantItems,
        },
        {
          key: 'title',
        },
        {
          key: 'viewed_by',
          sortable: true,
        },
        {
          key: 'interested_agencies',
          sortable: true,
        },
        {
          // opportunity_status
          key: 'status',
          hideGrantItem: this.hideGrantItems,
        },
        {
          key: 'opportunity_category',
          hideGrantItem: this.hideGrantItems,
        },
        {
          key: 'cost_sharing',
        },
        {
          key: 'award_floor',
        },
        {
          key: 'award_ceiling',
          sortable: true,
        },
        {
          key: 'open_date',
          sortable: true,
        },
        {
          key: 'close_date',
          sortable: true,
        },
      ],
      selectedGrant: null,
      selectedGrantIndex: null,
      orderBy: 'open_date',
      orderDesc: true,
      searchInput: null,
      debouncedSearchInput: null,
      reviewStatusFilters: [],
      opportunityStatusFilters: [],
      opportunityCategoryFilters: [],
      costSharingFilter: null,
      reviewStatusOptions: ['interested', 'result', 'rejected'],
      opportunityStatusOptions: ['Forecasted', 'Posted', 'Closed / Archived'],
      opportunityCategoryOptions: ['Discretionary', 'Mandatory', 'Earmark', 'Continuation'],
      costSharingOptions: ['Yes', 'No'],
    };
  },
  mounted() {
    document.addEventListener('keyup', this.changeSelectedGrantIndex);
    this.setup();
  },
  computed: {
    ...mapGetters({
      grants: 'grants/grants',
      grantsPagination: 'grants/grantsPagination',
      agency: 'users/agency',
      selectedAgency: 'users/selectedAgency',
    }),
    totalRows() {
      return this.grantsPagination ? this.grantsPagination.total : 0;
    },
    lastPage() {
      return this.grantsPagination ? this.grantsPagination.lastPage : 0;
    },
    formattedGrants() {
      const DAYS_TO_MILLISECS = 24 * 60 * 60 * 1000;
      const warningThreshold = (this.agency.warning_threshold || 30) * DAYS_TO_MILLISECS;
      const dangerThreshold = (this.agency.danger_threshold || 15) * DAYS_TO_MILLISECS;
      const now = new Date();
      return this.grants.map((grant) => ({
        ...grant,
        interested_agencies: grant.interested_agencies
          .map((v) => v.agency_abbreviation)
          .join(', '),
        viewed_by: grant.viewed_by_agencies
          .map((v) => v.agency_abbreviation)
          .join(', '),
        status: grant.opportunity_status,
        award_floor: this.getAwardFloor(grant),
        award_ceiling: grant.award_ceiling,
        open_date: new Date(grant.open_date).toLocaleDateString('en-US', { timeZone: 'UTC' }),
        close_date: new Date(grant.close_date).toLocaleDateString('en-US', { timeZone: 'UTC' }),
        _cellVariants: (() => {
          const diff = new Date(grant.close_date) - now;
          if (diff <= dangerThreshold) {
            return { close_date: 'danger' };
          }
          if (diff <= warningThreshold) {
            return { close_date: 'warning' };
          }
          return {};
        })(),
      }));
    },
  },
  watch: {
    reviewStatusFilters() {
      this.paginateGrants();
    },
    opportunityStatusFilters() {
      this.paginateGrants();
    },
    opportunityCategoryFilters() {
      this.paginateGrants();
    },
    costSharingFilter() {
      this.paginateGrants();
    },
    selectedAgency() {
      this.setup();
    },
    currentPage() {
      this.paginateGrants();
    },
    orderBy() {
      this.paginateGrants();
    },
    orderDesc() {
      this.paginateGrants();
    },
    selectedGrantIndex() {
      this.changeSelectedGrant();
    },
    // when we fetch grants, refresh selectedGrant reference
    grants() {
      this.changeSelectedGrant();
    },
    debouncedSearchInput() {
      this.paginateGrants();
    },
    async selectedGrant() {
      if (!this.selectedGrant) {
        await this.paginateGrants();
      }
    },
  },
  methods: {
    ...mapActions({
      fetchGrants: 'grants/fetchGrants',
      navigateToExportCSV: 'grants/exportCSV',
    }),
    setup() {
      this.paginateGrants();
    },
    titleize,
    debounceSearchInput: debounce(function bounce(newVal) {
      this.debouncedSearchInput = newVal;
      this.searchFilters.include = newVal;
    }, 500),
    async paginateGrants() {
      try {
        this.loading = true;
        await this.fetchGrants({
          perPage: this.perPage,
          currentPage: this.currentPage,
          orderBy: this.orderBy,
          orderDesc: this.orderDesc,
          searchTerm: this.debouncedSearchInput,
          interestedByAgency: this.showInterested || this.showResult || this.showRejected,
          interestedByMe: this.showMyInterested,
          aging: this.showAging,
          assignedToAgency: this.showAssignedToAgency,
          positiveInterest: this.showInterested || (this.reviewStatusFilters.includes('interested') ? true : null),
          result: this.showResult || (this.reviewStatusFilters.includes('result') ? true : null),
          rejected: this.showRejected || (this.reviewStatusFilters.includes('rejected') ? true : null),
          opportunityStatuses: this.parseOpportunityStatusFilters(),
          opportunityCategories: this.opportunityCategoryFilters,
          costSharing: this.costSharingFilter,
        });
      } catch (e) {
        console.log(e);
      } finally {
        this.loading = false;
      }
    },
    getAwardFloor(grant) {
      let body;
      try {
        body = JSON.parse(grant.raw_body);
      } catch (err) {
        // Some seeded test data has invalid JSON in raw_body field
        return undefined;
      }

      // For some reason, some grants rows have null raw_body.
      // TODO: investigate how this can happen
      if (!body) {
        return undefined;
      }

      const floor = parseInt(body.synopsis && body.synopsis.awardFloor, 10);
      if (Number.isNaN(floor)) {
        return undefined;
      }
      return floor;
    },
    onRowSelected(items) {
      const [row] = items;
      if (row) {
        const grant = this.grants.find((g) => row.grant_id === g.grant_id);
        this.selectedGrant = grant;
        this.selectedGrantIndex = this.grants.findIndex(
          (g) => row.grant_id === g.grant_id,
        );
      }
    },
    changeSelectedGrant() {
      if (this.selectedGrant) {
        const grant = this.grants[this.selectedGrantIndex];
        this.onRowSelected([grant]);
      }
    },
    // able to navigate through grants using left and right arrow keys, when dialog is selected
    changeSelectedGrantIndex(event) {
      if (event.keyCode === 37) {
        // left key
        if (this.currentPage === 1 && this.selectedGrantIndex === 0) {
          return;
        }
        if (this.currentPage !== 1 && this.selectedGrantIndex === 0) {
          // fetch previous page of grants
          this.currentPage -= 1;
          this.selectedGrantIndex = 0;
          return;
        }
        this.selectedGrantIndex -= 1;
      } else if (event.keyCode === 39) {
        // right key
        if (this.currentPage === this.lastPage) {
          return;
        }
        if (this.selectedGrantIndex + 1 === this.perPage) {
          // fetch next page of grants
          this.currentPage += 1;
          this.selectedGrantIndex = 0;
          return;
        }
        this.selectedGrantIndex += 1;
      }
    },
    async grantUpdated() {
      await this.paginateGrants();
      const grant = this.grants.find(
        (g) => this.selectedGrant.grant_id === g.grant_id,
      );
      this.selectedGrant = grant;
      this.selectedGrantIndex = this.grants.findIndex(
        (g) => this.selectedGrant.grant_id === g.grant_id,
      );
    },
    exportCSV() {
      this.navigateToExportCSV({
        orderBy: this.orderBy,
        orderDesc: this.orderDesc,
        searchTerm: this.debouncedSearchInput,
        interestedByAgency: this.showInterested || this.showResult || this.showRejected,
        interestedByMe: this.showMyInterested,
        aging: this.showAging,
        assignedToAgency: this.showAssignedToAgency,
        positiveInterest: this.showInterested || (this.reviewStatusFilters.includes('interested') ? true : null),
        result: this.showResult || (this.reviewStatusFilters.includes('result') ? true : null),
        rejected: this.showRejected || (this.reviewStatusFilters.includes('rejected') ? true : null),
        opportunityStatuses: this.parseOpportunityStatusFilters(),
        opportunityCategories: this.opportunityCategoryFilters,
        costSharing: this.costSharingFilter,
      });
    },
    parseOpportunityStatusFilters() {
      const filtersCopy = this.opportunityStatusFilters.map((status) => status.toLowerCase());
      const i = filtersCopy.indexOf('closed / archived');
      if (i === -1) {
        return filtersCopy;
      }
      filtersCopy.splice(i, 1);
      filtersCopy.push('closed');
      filtersCopy.push('archived');
      return filtersCopy;
    },
    formatMoney(value) {
      if (value === undefined) {
        return '';
      }
      const res = Number(value).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        style: 'currency',
        currency: 'USD',
      });
      return (`${res}`);
    },
  },
};
</script>
