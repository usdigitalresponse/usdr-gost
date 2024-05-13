<template>
  <section class="container-fluid grants-table-container">
    <b-row
      v-if="showSearchControls"
      class="my-3"
    >
      <div class="ml-3">
        <SavedSearchPanel :is-disabled="loading" />
      </div>
      <div class="ml-1">
        <SearchPanel
          ref="searchPanel"
          :is-disabled="loading"
          :search-id="Number(editingSearchId)"
          @filters-applied="retrieveFilteredGrants"
        />
      </div>
    </b-row>
    <b-row class="grants-table-title-control">
      <b-col v-if="showSearchControls">
        <SearchFilter
          :is-disabled="loading"
          :filter-keys="searchFilters"
          @filter-removed="onFilterRemoved"
        />
      </b-col>
      <b-col
        v-if="!showSearchControls"
        align-self="end"
      >
        <h2 class="mb-0">
          {{ searchTitle }}
        </h2>
      </b-col>
      <b-col class="d-flex justify-content-end">
        <b-button
          :disabled="loading"
          variant="outline-primary"
          size="sm"
          @click="exportCSV"
        >
          <b-icon
            icon="download"
            class="mr-2"
            aria-hidden="true"
          />Export to CSV
        </b-button>
      </b-col>
    </b-row>
    <b-row align-v="center">
      <b-col cols="12">
        <b-table
          id="grants-table"
          responsive
          bordered
          striped
          hover
          stacked="sm"
          :busy="loading"
          :items="formattedGrants"
          :fields="fields.filter(field => !field.hideGrantItem)"
          show-empty
          empty-text="No matches found"
          no-local-sorting
          :sort-by.sync="orderBy"
          :sort-desc.sync="orderDesc"
          selectable
          select-mode="single"
          :tbody-tr-attr="{'data-dd-action-name': 'grant search result'}"
          @row-selected="onRowSelected"
          @row-clicked="onRowClicked"
          @sort-changed="currentPage = 1"
        >
          <template #cell(award_ceiling)="row">
            <p> {{ formatCurrency(row.item.award_ceiling) }}</p>
          </template>
          <template #table-busy>
            <div
              class="text-center text-info my-2"
              style="height: 1200px;"
            >
              <b-spinner class="align-middle" />
              <strong> Loading...</strong>
            </div>
          </template>
          <template #empty="scope">
            &emsp;
            &emsp;
            <div class="text-center">
              <p class="empty-text">
                <strong>{{ scope.emptyText }}</strong>
              </p>
              <div v-if="showSearchControls">
                <p class="empty-text">
                  Tip: Broaden your search or adjust your keywords for more results
                </p>
              &nbsp;
                <p>
                  <a
                    class="link"
                    @click="initEditSearch(searchId);"
                  >
                    Edit Search Criteria
                  </a>
                </p>
              </div>
            </div>
          </template>
        </b-table>
      </b-col>
    </b-row>
    <b-row class="grants-table-pagination">
      <b-col
        cols="11"
        class="grants-table-pagination-component"
      >
        <!--
          Pagination component resets currentPage to 1 if totalRows is too low.
          When loading the page with e.g. `?page=4`, this would reset the currentPage to 1
          instead of 4. So we delay rendering of the pagination until grants are loaded.
        -->
        <template v-if="totalRows > 0">
          <b-pagination
            v-model="currentPage"
            class="m-0"
            :total-rows="totalRows"
            :per-page="perPage"
            first-text="First"
            prev-text="Prev"
            next-text="Next"
            last-text="Last"
            aria-controls="grants-table"
          />
        </template>
        <div class="my-1 rounded py-1 px-2 page-item">
          {{ totalRows }} total grant{{ totalRows == 1 ? '' : 's' }}
        </div>
      </b-col>
    </b-row>
    <GrantDetailsLegacy
      v-if="!newGrantsDetailPageEnabled"
      :selected-grant.sync="selectedGrant"
    />
  </section>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import { newTerminologyEnabled, newGrantsDetailPageEnabled } from '@/helpers/featureFlags';
import { datadogRum } from '@datadog/browser-rum';
import { titleize } from '@/helpers/form-helpers';
import { daysUntil } from '@/helpers/dates';
import { defaultCloseDateThresholds } from '@/helpers/constants';
import { formatCurrency } from '@/helpers/currency';
import GrantDetailsLegacy from '@/components/Modals/GrantDetailsLegacy.vue';
import SearchPanel from '@/components/Modals/SearchPanel.vue';
import SavedSearchPanel from '@/components/Modals/SavedSearchPanel.vue';
import SearchFilter from '@/components/SearchFilter.vue';

const DEFAULT_CURRENT_PAGE = 1;
const DEFAULT_ORDER_BY = 'rank';
const DEFAULT_ORDER_DESC = false;
const DEFAULT_SEARCH_ID = null;

export default {
  components: {
    GrantDetailsLegacy, SearchPanel, SavedSearchPanel, SearchFilter,
  },
  props: {
    showInterested: Boolean,
    showRejected: Boolean,
    showResult: Boolean,
    showAssignedToAgency: {
      type: String,
      default: undefined,
    },
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
      currentPage: DEFAULT_CURRENT_PAGE,
      perPage: 50,
      loading: false,
      fields: [
        {
          key: 'title',
        },
        {
          key: 'viewed_by',
        },
        {
          key: 'interested_agencies',
          label: `Interested ${newTerminologyEnabled() ? 'Teams' : 'Agencies'}`,
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
      orderBy: DEFAULT_ORDER_BY,
      orderDesc: DEFAULT_ORDER_DESC,
    };
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
      savedSearches: 'grants/savedSearches',
    }),
    searchId() {
      return (this.selectedSearchId === null || Number.isNaN(this.selectedSearchId)) ? null : Number(this.selectedSearchId);
    },
    routeQuery() {
      const query = {
        page: this.currentPage,
        sort: this.orderBy,
        desc: this.orderDesc,
        search: this.searchId,
      };
      if (query.page === DEFAULT_CURRENT_PAGE) {
        delete query.page;
      }
      if (!query.sort || query.sort === DEFAULT_ORDER_BY) {
        delete query.sort;
      }
      if (!query.desc) {
        delete query.desc;
      }
      if (!query.search) {
        delete query.search;
      }
      return query;
    },
    totalRows() {
      return this.grantsPagination ? this.grantsPagination.total : 0;
    },
    lastPage() {
      return this.grantsPagination ? this.grantsPagination.lastPage : 0;
    },
    formattedGrants() {
      const warningThreshold = this.agency.warning_threshold || defaultCloseDateThresholds.warning;
      const dangerThreshold = this.agency.danger_threshold || defaultCloseDateThresholds.danger;
      const generateTitle = (t) => {
        const txt = document.createElement('textarea');
        txt.innerHTML = t;
        return txt.value;
      };
      return this.grants.map((grant) => ({
        ...grant,
        title: generateTitle(grant.title),
        interested_agencies: grant.interested_agencies
          .map((v) => v.agency_abbreviation)
          .join(', '),
        viewed_by: grant.viewed_by_agencies
          .map((v) => v.agency_abbreviation)
          .join(', '),
        status: grant.opportunity_status,
        award_ceiling: grant.award_ceiling,
        open_date: new Date(grant.open_date).toLocaleDateString('en-US', { timeZone: 'UTC' }),
        close_date: new Date(grant.close_date).toLocaleDateString('en-US', { timeZone: 'UTC' }),
        _cellVariants: (() => {
          const daysUntilClose = daysUntil(grant.close_date);
          if (daysUntilClose <= dangerThreshold) {
            return { close_date: 'danger' };
          }
          if (daysUntilClose <= warningThreshold) {
            return { close_date: 'warning' };
          }
          return {};
        })(),
      }));
    },
    searchFilters() {
      return this.activeFilters;
    },
    newGrantsDetailPageEnabled() {
      return newGrantsDetailPageEnabled();
    },
  },
  watch: {
    selectedAgency() {
      this.clearSelectedSearch();
      this.retrieveFilteredGrants();
    },
    selectedGrantIndex() {
      this.changeSelectedGrant();
    },
    grants() {
      // when we fetch grants, refresh selectedGrant reference
      this.changeSelectedGrant();
    },
  },
  async mounted() {
    document.addEventListener('keyup', this.changeSelectedGrantIndex);
    this.clearSelectedSearch();

    // Watch route query updates and reflect them in the component
    // (This happens with browser back/forward through history)
    this.$watch(
      () => this.$route.query,
      this.extractStateFromRoute,
      { deep: true },
    );

    // Retrieve the initial grants list for the table
    if (this.$route.query.search) {
      // We need to load saved searches before extracting initial state from route
      this.loading = true;
      await this.fetchSavedSearches({
        perPage: 100, // TODO: make this robust to users with more saved searches
        currentPage: 1,
      });
      this.extractStateFromRoute();
      this.retrieveFilteredGrants();
      this.loading = false;
    } else {
      this.extractStateFromRoute();
      this.retrieveFilteredGrants();
    }

    // Watch route query and push a route update when it changes.
    // This needs to be set up after the initial setting of related
    // data (currentPage, order, etc.) so it won't trigger initially.
    this.$watch(
      () => this.routeQuery,
      (routeQuery) => {
        this.pushRouteUpdate(routeQuery);
        this.retrieveFilteredGrants();
      },
      { deep: true, immediate: false },
    );

    // Watch selected search and reset orderBy and orderDesc
    // (This must be done after these values are set on initial page load
    // to prevent them being overwritten)
    this.$watch(
      'selectedSearchId',
      () => {
        this.currentPage = 1;
        const filterKeys = this.activeFilters.map((f) => f.key);
        if (this.searchId !== null && (filterKeys.includes('includeKeywords') || filterKeys.includes('excludeKeywords'))) {
        // only if include/exclude keywords are selected
          this.orderBy = 'rank';
          this.orderDesc = false;
        } else {
          this.orderBy = 'open_date';
          this.orderDesc = true;
        }
      },
    );
  },
  methods: {
    ...mapActions({
      fetchGrants: 'grants/fetchGrantsNext',
      navigateToExportCSV: 'grants/exportCSV',
      clearSelectedSearch: 'grants/clearSelectedSearch',
      changeSelectedSearchId: 'grants/changeSelectedSearchId',
      changeEditingSearchId: 'grants/changeEditingSearchId',
      initEditSearch: 'grants/initEditSearch',
      applyFilters: 'grants/applyFilters',
      initViewResults: 'grants/initViewResults',
      fetchSavedSearches: 'grants/fetchSavedSearches',
    }),
    titleize,
    formatCurrency,
    extractStateFromRoute() {
      this.currentPage = Number(this.$route.query.page) || DEFAULT_CURRENT_PAGE;
      this.orderBy = this.$route.query.sort || DEFAULT_ORDER_BY;
      this.orderDesc = Boolean(this.$route.query.desc);

      // Manage search state
      const routeSearchId = Number(this.$route.query.search) || DEFAULT_SEARCH_ID;
      if (routeSearchId && this.savedSearches) {
        const searchData = this.savedSearches.data.find((search) => search.id === routeSearchId);
        if (searchData) {
          this.changeSelectedSearchId(routeSearchId);
          this.applyFilters(JSON.parse(searchData.criteria));
          this.initViewResults();
        } else {
          // Remove search query param if it's not found in saved searches
          this.clearSelectedSearch();
          this.pushRouteUpdate(this.routeQuery, true);
        }
      }
    },
    onFilterRemoved() {
      this.orderBy = DEFAULT_ORDER_BY;
      this.orderDesc = DEFAULT_ORDER_DESC;
    },
    async retrieveFilteredGrants() {
      this.loading = true;
      try {
        if (!this.searchId) {
          // apply custom filters based on props
          await this.applyFilters({
            reviewStatus: [
              `${this.showInterested ? 'Interested' : ''}`,
              `${this.showResult ? 'Applied' : ''}`,
              `${this.showRejected ? 'Not Applying' : ''}`,
              `${this.showAssignedToAgency ? 'Assigned' : ''}`,
            ].filter((r) => r),
          });
        }
        await this.fetchGrants({
          perPage: this.perPage,
          currentPage: this.currentPage,
          orderBy: this.orderBy,
          orderDesc: this.orderDesc,
          showInterested: this.showInterested,
          showResult: this.showResult,
          showRejected: this.showRejected,
          assignedToAgency: this.showAssignedToAgency,
        });
        // Clamp currentPage to valid range
        const clampedPage = Math.max(Math.min(this.currentPage, this.lastPage), 1);
        if (clampedPage !== this.currentPage) {
          this.currentPage = clampedPage;
        }
      } catch (error) {
        this.notifyError();
        console.error(error);
      } finally {
        this.loading = false;
      }
    },
    pushRouteUpdate(newQuery, replace) {
      // First remove the query params the table controls, so they don't get carried over in the case
      // that the new query wants it removed (e.g., when resetting currentPage to 1)
      const currentQuery = { ...this.$route.query };
      delete currentQuery.page;
      delete currentQuery.sort;
      delete currentQuery.desc;
      delete currentQuery.search;
      // Next, combine this with other existing route details
      const newRoute = {
        ...this.$route,
        query: {
          ...currentQuery,
          ...newQuery,
        },
      };
      if (replace) {
        this.$router.replace(newRoute);
      } else {
        this.$router.push(newRoute);
      }
    },
    notifyError() {
      this.$bvToast.toast('We encountered an error while retrieving grants data. For the most accurate results please refresh the page and try again.', {
        title: 'Something went wrong',
        variant: 'danger',
        solid: true,
        noAutoHide: true,
        toaster: 'b-toaster-top-center',
      });
    },
    onRowClicked(item) {
      if (!newGrantsDetailPageEnabled()) {
        return;
      }
      this.$router.push({ name: 'grantDetail', params: { id: item.grant_id } });
      datadogRum.addAction('view grant details', { grant: item });
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
    exportCSV() {
      this.navigateToExportCSV({
        perPage: this.perPage,
        currentPage: this.currentPage,
        orderBy: this.orderBy,
        orderDesc: this.orderDesc,
        showInterested: this.showInterested,
        showResult: this.showResult,
        showRejected: this.showRejected,
        assignedToAgency: this.showAssignedToAgency,
      });
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
.grants-table-title-control {
  padding-bottom: .75rem;
}
.grants-table-pagination {
  padding-bottom: .75rem;
}
.grants-table-pagination-component {
  display: flex;
  justify-content: left;
  align-items: center;
}
</style>
