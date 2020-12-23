<template>
<section class="container-fluid">
  <h2>Grants</h2>
  <b-table
    id="grants-table"
    sticky-header="600px" hover :items="formattedGrants" :fields="fields"
    selectable
    striped
    select-mode="single"
    :table-busy="loading"
    no-local-sorting
    @row-selected="onRowSelected"
    @sort-changed="sortingChanged">
  </b-table>
    <b-row align-v="center">
      <b-pagination class="m-0"
        v-model="currentPage"
        :total-rows="totalRows"
        :per-page="perPage"
        first-number
        last-number
        first-text="First"
        prev-text="Prev"
        next-text="Next"
        last-text="Last"
        aria-controls="grants-table"/>
        <b-button class="ml-2" variant="outline-primary disabled">{{grants.length}} of {{totalRows}}</b-button>
    </b-row>
   <!-- Info modal -->
  <b-modal v-model="showGrantModal"
    ok-only
    :title="selectedGrant && selectedGrant.title"
    @hide="resetSelectedGrant"
    scrollable
    header-bg-variant="primary"
    header-text-variant="light"
    body-bg-variant="light"
    body-text-variant="dark"
    footer-bg-variant="dark"
    footer-text-variant="light">
    <div v-if="selectedGrant">
      <b-row>
        <b-col>
          <h3>{{selectedGrant.grant_number}}</h3>
        </b-col>
        <b-col class="text-right">
          <b-button v-if="interested" variant="dark" disabled>Interested</b-button>
          <b-button v-else variant="outline-success" @click="markGrantAsInterested">Mark as Interested</b-button>
        </b-col>
      </b-row>
      <h6>Valid from: {{new Date(selectedGrant.open_date).toLocaleDateString('en-US')}}-{{new Date(selectedGrant.close_date).toLocaleDateString('en-US')}}</h6>
      <div v-for="field in dialogFields" :key="field">
        <p><span style="font-weight:bold">{{titleize(field)}}</span>: {{selectedGrant[field]}}</p>
      </div>
      <h6>Description</h6>
      <div style="max-height: 170px; overflow-y: scroll">
        <p>{{removeTags(selectedGrant.description)}}</p>
      </div>
    </div>
  </b-modal>
</section>
</template>

<script>

import { mapActions, mapGetters } from 'vuex';

import { titleize } from '@/helpers/form-helpers';

export default {
  components: {
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
        },
        {
          key: 'interested_agencies',
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
      viewedConfirmed: false,
      interestedConfirmed: false,
      showGrantModal: false,
      selectedGrant: null,
      dialogFields: ['grant_id', 'agency_code', 'award_ceiling', 'cfda_list', 'opportunity_category'],
      orderBy: '',
    };
  },
  mounted() {
    this.paginatedGrants();
  },
  computed: {
    ...mapGetters({
      agency: 'users/agency',
      grants: 'grants/grants',
      grantsPagination: 'grants/grantsPagination',
    }),
    totalRows() {
      return this.grantsPagination ? this.grantsPagination.total : 0;
    },
    alreadyViewed() {
      if (!this.selectedGrant || !this.selectedGrant) {
        return false;
      }
      return this.viewedConfirmed || this.selectedGrant.viewed_by_agencies.find((viewed) => viewed.agency_id === this.agency.id);
    },
    interested() {
      if (!this.selectedGrant || !this.selectedGrant) {
        return false;
      }
      return this.interestedConfirmed || this.selectedGrant.interested_agencies.find((interested) => interested.agency_id === this.agency.id);
    },
    formattedGrants() {
      return this.grants.map((grant) => ({
        ...grant,
        interested_agencies: grant.interested_agencies.map((v) => v.abbreviation).join(', '),
        viewed_by: grant.viewed_by_agencies.map((v) => v.abbreviation).join(', '),
        status: grant.opportunity_status,
        open_date: new Date(grant.open_date).toLocaleDateString('en-US'),
        close_date: new Date(grant.close_date).toLocaleDateString('en-US'),
        created_at: new Date(grant.created_at).toLocaleString(),
        updated_at: new Date(grant.updated_at).toLocaleString(),
      }));
    },
  },
  watch: {
    currentPage() {
      this.paginatedGrants();
    },
    orderBy() {
      this.paginatedGrants();
    },
    async alreadyViewed() {
      if (!this.alreadyViewed && this.selectedGrant) {
        await this.markGrantAsViewedAction({ grantId: this.selectedGrant.grant_id, agencyId: this.agency.id });
      }
    },
  },
  methods: {
    ...mapActions({
      fetchGrants: 'grants/fetchGrants',
      markGrantAsViewedAction: 'grants/markGrantAsViewed',
      markGrantAsInterestedAction: 'grants/markGrantAsInterested',
    }),
    titleize,
    async paginatedGrants() {
      try {
        this.loading = true;
        this.fetchGrants({ perPage: this.perPage, currentPage: this.currentPage, orderBy: this.orderBy });
      } catch (e) {
        console.log(e);
      } finally {
        this.loading = false;
      }
    },
    sortingChanged(ctx) {
      this.orderBy = `${ctx.sortBy}|${ctx.sortDesc ? 'desc' : 'asc'}`;
      this.currentPage = 1;
    },
    async markGrantAsViewed() {
      await this.markGrantAsViewedAction({ grantId: this.selectedGrant.grant_id, agencyId: this.agency.id });
    },
    async markGrantAsInterested() {
      await this.markGrantAsInterestedAction({ grantId: this.selectedGrant.grant_id, agencyId: this.agency.id });
      this.interestedConfirmed = true;
    },
    onRowSelected(items) {
      const [row] = items;
      if (row) {
        const grant = this.grants.find((g) => row.grant_id === g.grant_id);
        this.selectedGrant = grant;
        this.showGrantModal = Boolean(grant);
      }
    },
    resetSelectedGrant() {
      this.showGrantModal = false;
      this.viewedConfirmed = false;
      this.interestedConfirmed = false;
      this.selectedGrant = null;
      this.paginatedGrants();
    },
    removeTags(str) {
      return str.replace(/(<([^>]+)>)/ig, '').replace(/&nbsp;/ig, '');
    },
  },
};
</script>
