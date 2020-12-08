<template>
<section class="container-fluid">
  <h2>Grants</h2>
  <b-table
    id="grants-table"
    sticky-header="600px" hover :items="grants" :fields="fields"
    selectable
    striped
    select-mode="single"
    :table-busy="loading"
    @row-selected="onRowSelected"/>
  <b-pagination
      v-model="currentPage"
      :total-rows="totalRows"
      :per-page="perPage"
      aria-controls="grants-table"/>
   <!-- Info modal -->
  <b-modal v-model="showGrantModal"
    ok-only
    :title="selectedGrant && selectedGrant.title"
    @hide="resetSelectedGrant"
    header-bg-variant="primary"
    header-text-variant="light"
    body-bg-variant="light"
    body-text-variant="dark"
    footer-bg-variant="dark"
    footer-text-variant="light">
    <div v-if="selectedGrant">
          <b-row>
      <!-- {
  "grant_id": "328943",
  "grant_number": "HRSA-21-023",
  "title": "National Telehealth Resource Center Program",
  "status": "inbox",
  "agency_code": "HHS-HRSA",
  "award_ceiling": "325000",
  "cost_sharing": "No",
  "cfda_list": "93.211",
  "open_date": "10/23/2020",
  "close_date": "01/21/2021",
  "reviewer_name": "none",
  "opportunity_category": "Discretionary",
  "search_terms": "Covid [in title/desc]\nCOVID-19 [in title/desc]\n",
  "notes": "auto-inserted by script",
  "created_at": "2020-10-27T01:21:39.100Z",
  "updated_at": "2020-10-31T00:53:37.407Z",
  "viewed_by_agencies": [
    {
      "grant_id": "328943",
      "agency_id": 1,
      "name": "department of health"
    }
  ],
  "viewed_by_agencies_formatted": "department of health"
} -->
    <b-col>
      <h3>{{selectedGrant.grant_number}}</h3>
    </b-col>
    <b-col class="text-right">
      <b-button v-if="alreadyViewed" variant="dark" disabled>Viewed</b-button>
      <b-button v-else variant="outline-success" @click="markGrantAsViewed">Mark as Viewed</b-button>
    </b-col>
  </b-row>
    <h6>Valid from: {{selectedGrant.open_date}}-{{selectedGrant.close_date}}</h6>
    <br/>
    <pre>{{ selectedGrant }}</pre>
    </div>
  </b-modal>
</section>
</template>

<script>

import { mapActions, mapGetters } from 'vuex';

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
          key: 'status',
        },
        {
          key: 'viewed_by_agencies_formatted',
        },
        {
          key: 'agency_code',
        },
        {
          key: 'cost_sharing',
        },
        {
          key: 'open_date',
        },
        {
          key: 'opportunity_category',
        },
        { key: 'search_terms' },
        { key: 'notes' },
        { key: 'created_at' },
        { key: 'updated_at' },
        {
          key: 'created_at',
        },
        {
          key: 'updated_at',
        },
      ],
      viewedConfirmed: false,
      showGrantModal: false,
      selectedGrant: null,
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
  },
  watch: {
    currentPage() {
      this.paginatedGrants();
    },
  },
  methods: {
    ...mapActions({
      fetchGrants: 'grants/fetchGrants',
      markGrantAsViewedAction: 'grants/markGrantAsViewed',
    }),
    async paginatedGrants() {
      try {
        this.loading = true;
        this.fetchGrants({ perPage: this.perPage, currentPage: this.currentPage });
      } catch (e) {
        console.log(e);
      } finally {
        this.loading = false;
      }
    },
    async markGrantAsViewed() {
      await this.markGrantAsViewedAction({ grantId: this.selectedGrant.grant_id, agencyId: this.agency.id });
      this.viewedConfirmed = true;
    },
    showModal() {
      this.$refs['my-modal'].show();
    },
    hideModal() {
      this.$refs['my-modal'].hide();
    },
    onRowSelected(items) {
      const [row] = items;
      if (row) {
        this.selectedGrant = row;
        this.showGrantModal = true;
      }
    },
    resetSelectedGrant() {
      this.showGrantModal = false;
      this.viewedConfirmed = false;
      this.selectedGrant = null;
    },
  },
};
</script>
