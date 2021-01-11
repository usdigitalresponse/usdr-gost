<template>
<section class="container-fluid">
  <h2>Grants</h2>
  <b-table
    id="grants-table"
    sticky-header="600px" hover :items="formattedGrants" :fields="fields"
    selectable
    striped
    select-mode="single"
    :busy="loading"
    no-local-sorting
    @row-selected="onRowSelected"
    @sort-changed="sortingChanged">
    <template #table-busy>
      <div class="text-center text-danger my-2">
        <b-spinner class="align-middle"></b-spinner>
        <strong> Loading...</strong>
      </div>
    </template>
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
    size="lg"
    header-bg-variant="primary"
    header-text-variant="light"
    body-bg-variant="light"
    body-text-variant="dark"
    footer-bg-variant="dark"
    footer-text-variant="light">
    <div v-if="selectedGrant">
      <b-row>
        <b-col cols="9">
          <h3>Grant Number: {{selectedGrant.grant_number}}</h3>
        </b-col>
        <b-col cols="3" class="text-right">
          <b-button
            :href="`https://www.grants.gov/web/grants/view-opportunity.html?oppId=${selectedGrant.grant_id}`"
            target="_blank"
            rel="noopener noreferrer"
            variant="primary">
            Grants.Gov <b-icon icon="link" aria-hidden="true"></b-icon>
          </b-button>
        </b-col>
      </b-row>
      <p><span style="font-weight:bold">Valid from:</span> {{new Date(selectedGrant.open_date).toLocaleDateString('en-US')}}-{{new Date(selectedGrant.close_date).toLocaleDateString('en-US')}}</p>
      <div v-for="field in dialogFields" :key="field">
        <p><span style="font-weight:bold">{{titleize(field)}}:</span> {{selectedGrant[field]}}</p>
      </div>
      <h6>Description</h6>
      <div style="max-height: 170px; overflow-y: scroll">
        <div style="white-space: pre-line" v-html="selectedGrant.description"></div>
      </div>
      <br/>
      <b-row>
        <b-col>
          <h4>Interested Agencies</h4>
        </b-col>
        <b-col class="text-right">
          <b-row v-if="!interested">
            <b-col cols="9">
              <b-form-select v-model="selectedInterestedCode">
                <b-form-select-option-group label="Interested">
                  <b-form-select-option v-for="code in interestedCodes.interested"  :key="code.id" :value="code.id">{{code.name}}</b-form-select-option>
                </b-form-select-option-group>
                <b-form-select-option-group label="Rejections">
                  <b-form-select-option v-for="code in interestedCodes.rejections"  :key="code.id" :value="code.id">{{code.name}}</b-form-select-option>
                </b-form-select-option-group>
              </b-form-select>
            </b-col>
            <b-col cols="3" class="text-right">
              <b-button variant="outline-success" @click="markGrantAsInterested">Submit</b-button>
            </b-col>
          </b-row>
        </b-col>
      </b-row>
      <br/>
      <b-table
        :items="selectedGrant.interested_agencies"
        :fields="interestedAgenciesFields"
      />
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
      showGrantModal: false,
      selectedGrant: null,
      selectedGrantIndex: null,
      dialogFields: ['grant_id', 'agency_code', 'award_ceiling', 'cfda_list', 'opportunity_category'],
      orderBy: '',
      interestedAgenciesFields: [
        {
          key: 'agency_name',
        },
        {
          key: 'agency_abbreviation',
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
      ],
      selectedInterestedCode: null,
    };
  },
  mounted() {
    document.addEventListener('keyup', this.changeSelectedGrantIndex);
    this.paginatedGrants();
  },
  computed: {
    ...mapGetters({
      agency: 'users/agency',
      grants: 'grants/grants',
      grantsPagination: 'grants/grantsPagination',
      interestedCodes: 'grants/interestedCodes',
    }),
    totalRows() {
      return this.grantsPagination ? this.grantsPagination.total : 0;
    },
    lastPage() {
      return this.grantsPagination ? this.grantsPagination.lastPage : 0;
    },
    alreadyViewed() {
      if (!this.selectedGrant) {
        return false;
      }
      return this.selectedGrant.viewed_by_agencies.find((viewed) => viewed.agency_id === this.agency.id);
    },
    interested() {
      if (!this.selectedGrant) {
        return false;
      }
      return this.selectedGrant.interested_agencies.find((interested) => interested.agency_id === this.agency.id);
    },
    formattedGrants() {
      return this.grants.map((grant) => ({
        ...grant,
        interested_agencies: grant.interested_agencies.map((v) => v.agency_abbreviation).join(', '),
        viewed_by: grant.viewed_by_agencies.map((v) => v.agency_abbreviation).join(', '),
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
    async selectedGrant() {
      if (this.selectedGrant) {
        if (!this.alreadyViewed) {
          this.markGrantAsViewed();
        }
      }
    },
    selectedGrantIndex() {
      this.changeSelectedGrant();
    },
    // when we fetch grants, refresh selectedGrant reference
    grants() {
      this.changeSelectedGrant();
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
        await this.fetchGrants({ perPage: this.perPage, currentPage: this.currentPage, orderBy: this.orderBy });
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
    async markGrantAsViewed() {
      await this.markGrantAsViewedAction({ grantId: this.selectedGrant.grant_id, agencyId: this.agency.id });
      await this.paginatedGrants();
    },
    async markGrantAsInterested() {
      if (this.selectedInterestedCode !== null) {
        await this.markGrantAsInterestedAction({
          grantId: this.selectedGrant.grant_id,
          agencyId: this.agency.id,
          interestedCode: this.selectedInterestedCode,
        });
        await this.paginatedGrants();
      }
    },
    onRowSelected(items) {
      const [row] = items;
      if (row) {
        const grant = this.grants.find((g) => row.grant_id === g.grant_id);
        this.selectedGrant = grant;
        this.selectedGrantIndex = this.grants.findIndex((g) => row.grant_id === g.grant_id);
        this.showGrantModal = Boolean(grant);
      }
    },
    resetSelectedGrant() {
      this.showGrantModal = false;
      this.selectedGrant = null;
    },
    changeSelectedGrant() {
      if (this.showGrantModal) {
        const grant = this.grants[this.selectedGrantIndex];
        this.onRowSelected([grant]);
      }
    },
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
  },
};
</script>
