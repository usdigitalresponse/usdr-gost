<template>
  <section class="container-fluid">
    <b-row class="mt-3 mb-3" align-h="between">
      <b-col cols="5">
        <b-input-group size="md">
          <b-input-group-text>
            <b-icon icon="search" />
          </b-input-group-text>
          <b-form-input
            type="search"
            @input="debounceSearchInput"
          ></b-form-input>
        </b-input-group>
      </b-col>
      <b-col class="d-flex justify-content-end">
        <b-button
          @click="exportCSV"
          :disabled="loading"
          variant="outline-secondary"
        >
          <b-icon icon="download" class="mr-1 mb-1" font-scale="0.9" aria-hidden="true" />
          Export to CSV
        </b-button>
      </b-col>
    </b-row>
    <b-row v-if="!showInterested && !showRejected && !showAssignedToAgency" class="mt-3 mb-3" align-h="between"
    style="position: relative; z-index: 999">
      <b-col cols="3">
        <multiselect v-model="reviewStatusFilters" :options="reviewStatusOptions"
          :multiple="true" :close-on-select="false"
          :clear-on-select="false"
          placeholder="Review Status">
        </multiselect>
      </b-col>
    </b-row>
    <b-table
      id="grants-table"
      sticky-header="600px"
      hover
      :items="formattedGrants"
      :fields="fields"
      selectable
      striped
      select-mode="single"
      :busy="loading"
      no-local-sorting
      @row-selected="onRowSelected"
      @sort-changed="sortingChanged"
    >
      <template #table-busy>
        <div class="text-center text-danger my-2">
          <b-spinner class="align-middle"></b-spinner>
          <strong> Loading...</strong>
        </div>
      </template>
    </b-table>
    <b-row align-v="center">
      <b-pagination
        class="m-0"
        v-model="currentPage"
        :total-rows="totalRows"
        :per-page="perPage"
        first-number
        last-number
        first-text="First"
        prev-text="Prev"
        next-text="Next"
        last-text="Last"
        aria-controls="grants-table"
      />
      <b-button class="ml-2" variant="outline-primary disabled"
        >{{ grants.length }} of {{ totalRows }}</b-button
      >
    </b-row>
    <GrantDetails :selected-grant.sync="selectedGrant" />
  </section>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import { debounce } from 'lodash';
import Multiselect from 'vue-multiselect';

import { titleize } from '@/helpers/form-helpers';

import GrantDetails from '@/components/Modals/GrantDetails.vue';

export default {
  components: { GrantDetails, Multiselect },
  props: {
    showInterested: Boolean,
    showRejected: Boolean,
    showAging: Boolean,
    showAssignedToAgency: String,
  },
  data() {
    return {
      perPage: 10,
      currentPage: 1,
      loading: false,
      fields: [
        {
          key: 'grant_id',
          stickyColumn: true,
          variant: 'dark',
        },
        {
          key: 'grant_number',
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
          key: 'agency_code',
        },
        {
          key: 'cost_sharing',
        },
        {
          label: 'Posted Date',
          key: 'open_date',
          sortable: true,
        },
        {
          key: 'close_date',
          sortable: true,
        },
        {
          key: 'opportunity_category',
        },
        {
          // opportunity_status
          key: 'status',
        },
        {
          key: 'created_at',
        },
        {
          key: 'updated_at',
        },
      ],
      selectedGrant: null,
      selectedGrantIndex: null,
      orderBy: '',
      searchInput: null,
      debouncedSearchInput: null,
      reviewStatusFilters: [],
      reviewStatusOptions: ['interested', 'rejected'],
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
        open_date: new Date(grant.open_date).toLocaleDateString('en-US'),
        close_date: new Date(grant.close_date).toLocaleDateString('en-US'),
        created_at: new Date(grant.created_at).toLocaleString(),
        updated_at: new Date(grant.updated_at).toLocaleString(),
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
    selectedAgency() {
      this.setup();
    },
    currentPage() {
      this.paginateGrants();
    },
    orderBy() {
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
    }, 500),
    async paginateGrants() {
      try {
        this.loading = true;
        await this.fetchGrants({
          perPage: this.perPage,
          currentPage: this.currentPage,
          orderBy: this.orderBy,
          searchTerm: this.debouncedSearchInput,
          interestedByMe: this.showInterested,
          aging: this.showAging,
          assignedToAgency: this.showAssignedToAgency,
          positiveInterest: this.showInterested || (this.reviewStatusFilters.includes('interested') ? true : null),
          rejected: this.showRejected || (this.reviewStatusFilters.includes('rejected') ? true : null),
        });
      } catch (e) {
        console.log(e);
      } finally {
        this.loading = false;
      }
    },
    sortingChanged(ctx) {
      if (!ctx.sortBy) {
        this.orderBy = '';
      } else {
        this.orderBy = `${ctx.sortBy}|${ctx.sortDesc ? 'desc' : 'asc'}`;
      }
      this.currentPage = 1;
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
        searchTerm: this.debouncedSearchInput,
        interestedByMe: this.showInterested,
        aging: this.showAging,
        assignedToAgency: this.showAssignedToAgency,
        positiveInterest: this.showInterested || (this.reviewStatusFilters.includes('interested') ? true : null),
        rejected: this.showRejected || (this.reviewStatusFilters.includes('rejected') ? true : null),
      });
    },
  },
};
</script>
