<template>
  <section class="container-fluid grants-table-container">
    <b-row class="my-3" v-if="showSearchControls">
      <div class="ml-3">
        <SavedSearchPanel @filters-applied="paginateGrants" />
      </div>
      <div class="ml-3">
        <SearchPanel ref="searchPanel" :search-id="Number(editingSearchId)" @filters-applied="paginateGrants" />
      </div>
    </b-row>
    <b-row  class="grants-table-title-control">
      <b-col v-if="showSearchControls" >
        <SearchFilter :filterKeys="searchFilters" @filter-removed="paginateGrants" />
      </b-col>
      <b-col align-self="end" v-if="!showSearchControls">
        <h4 class="mb-0">{{ searchTitle }}</h4>
      </b-col>
      <b-col align-self="end">
        <a href="#" @click="exportCSV" :disabled="loading" variant="outline-primary border-0"
          class="text-right text-nowrap">
          <p class="mb-0">Export CSV</p>
        </a>
      </b-col>
    </b-row>
    <b-row align-v="center">
      <b-col cols="12">
        <b-table fixed id="grants-table" sticky-header="600px" hover :items="formattedGrants" responsive
          :fields="fields.filter(field => !field.hideGrantItem)" selectable striped :sort-by.sync="orderBy"
          :sort-desc.sync="orderDesc" :no-local-sorting="true" :bordered="true" select-mode="single" :busy="loading"
          @row-selected="onRowSelected" show-empty emptyText="No matches found">
          <template #cell(award_floor)="row">
            <p> {{ formatMoney(row.item.award_floor) }}</p>
          </template>
          <template #cell(award_ceiling)="row">
            <p> {{ formatMoney(row.item.award_ceiling) }}</p>
          </template>
          <template #table-busy>
            <div class="text-center text-info my-2" style="height: 1200px;">
              <b-spinner class="align-middle"></b-spinner>
              <strong> Loading...</strong>
            </div>
          </template>
          <template #empty="scope">
            &emsp;
            &emsp;
            <div class="text-center">
              <p class="empty-text"><strong>{{ scope.emptyText }}</strong></p>
              <p class="empty-text">Tip: Broaden your search or adjust your keywords for more results</p>
              &nbsp;
              <p><a @click="initEditSearch(searchId);" class="link">
                  Edit Search Criteria
                </a></p>
            </div>
          </template>
        </b-table>
      </b-col>
    </b-row>
    <b-row align-v="center">
      <b-col cols="12" class="d-flex">
        <b-pagination class="m-0" v-model="currentPage" :total-rows="totalRows" :per-page="perPage" first-number
          last-number first-text="First" prev-text="Prev" next-text="Next" last-text="Last"
          aria-controls="grants-table" />
        <div class="ml-2 border border-light rounded text-justify p-2 page-item">{{ grants.length }} of {{ totalRows }}</div>
      </b-col>
    </b-row>
    <GrantDetails :selected-grant.sync="selectedGrant" />
  </section>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import { titleize } from '../helpers/form-helpers';
import GrantDetails from './Modals/GrantDetails.vue';
import SearchPanel from './Modals/SearchPanel.vue';
import SavedSearchPanel from './Modals/SavedSearchPanel.vue';
import SearchFilter from './SearchFilter.vue';

export default {
  components: {
    GrantDetails, SearchPanel, SavedSearchPanel, SearchFilter,
  },
  props: {
    showMyInterested: Boolean,
    showInterested: Boolean,
    showRejected: Boolean,
    showResult: Boolean,
    showAging: Boolean,
    showAssignedToAgency: String,
    showSearchControls: {
      type: Boolean,
      default: true,
    },
    searchTitle: {
      type: String,
      default: '',
    },
  },
  data() {
    return {
      perPage: 50,
      currentPage: 1,
      loading: false,
      fields: [
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
      searchId: null,
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
      activeFilters: 'grants/activeFilters',
      selectedSearchId: 'grants/selectedSearchId',
      editingSearchId: 'grants/editingSearchId',
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
    searchFilters() {
      return this.activeFilters;
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
    selectedSearchId() {
      this.searchId = (this.selectedSearchId === null || Number.isNaN(this.selectedSearchId)) ? null : Number(this.selectedSearchId);
      this.paginateGrants();
    },
  },
  methods: {
    ...mapActions({
      fetchGrants: 'grants/fetchGrantsNext',
      navigateToExportCSV: 'grants/exportCSV',
      clearSelectedSearch: 'grants/clearSelectedSearch',
      initEditSearch: 'grants/initEditSearch',
    }),
    setup() {
      this.clearSelectedSearch();
      this.paginateGrants();
    },
    titleize,
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
          showInterested: this.showInterested,
          showResult: this.showResult,
          showRejected: this.showRejected,
          aging: this.showAging,
          assignedToAgency: this.showAssignedToAgency,
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
<style>
.empty-text {
  margin: 2px;
}

.grants-table-container {
  padding-left: 15px;
  padding-right: 15px;
}
/* set first columnheader th to 300px*/
#grants-table th:nth-child(1) {
  width: 300px;
}

</style>
