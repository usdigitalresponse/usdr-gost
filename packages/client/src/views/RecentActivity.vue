<template>
  <section class="container">
    <b-card class="border-0">
      <div class="d-flex">
        <h2 class="card-title gutter-title1 row h4">Recent Activity</h2>
        <div class="justify-content-end left-margin">
          <b-button @click="exportCSV" variant="outline-secondary">
            <b-icon icon="download" class="mr-1 mb-1" font-scale="0.9" aria-hidden="true" />
            Export to CSV
          </b-button>
        </div>
      </div>
      <ActivityTable id="activity-table" :grants-interested="grantsInterested" :on-row-clicked="onRowClicked" :on-row-selected="onRowSelected"/>
      <div class="d-flex">
        <b-pagination-nav class="m-0" use-router no-page-detect :value="currentPage" :number-of-pages="numberOfPages" :link-gen="linkGen" first-number
                      last-number first-text="First" prev-text="Prev" next-text="Next" last-text="Last" aria-controls="activity-table"/>
        <div class="my-1 rounded py-1 px-2 page-item">{{ totalInterestedGrants }} total event{{ totalInterestedGrants == 1 ? '' : 's' }}</div>
      </div>
    </b-card>
    <GrantDetailsLegacy v-if="!newGrantsDetailPageEnabled" :selected-grant.sync="selectedGrant" />
  </section>
</template>
<style scoped>
   .gutter-title1.row {
    margin-left: +4px;
  }
</style>

<script>
import { mapActions, mapGetters } from 'vuex';
import { newGrantsDetailPageEnabled } from '@/helpers/featureFlags';
import resizableTableMixin from '@/mixin/resizableTable';
import GrantDetailsLegacy from '@/components/Modals/GrantDetailsLegacy.vue';
import ActivityTable from '@/components/ActivityTable.vue';

export default {
  components: { ActivityTable, GrantDetailsLegacy },
  data() {
    return {
      perPage: 10,
      selectedGrant: null,
    };
  },
  mixins: [resizableTableMixin],
  mounted() {
    this.setup();
  },
  computed: {
    ...mapGetters({
      grants: 'grants/grants',
      grantsInterested: 'grants/grantsInterested',
      totalInterestedGrants: 'grants/totalInterestedGrants',
      currentGrant: 'grants/currentGrant',
    }),
    newGrantsDetailPageEnabled() {
      return newGrantsDetailPageEnabled();
    },
    currentPage() {
      return this.$route.query.page || 1;
    },
    numberOfPages() {
      return this.totalInterestedGrants ? Math.ceil(this.totalInterestedGrants / this.perPage) : 1;
    },
  },
  watch: {
    async selectedGrant() {
      if (!this.selectedGrant) {
        await this.fetchGrantsInterested();
      }
    },
    currentGrant() {
      if (this.selectedGrant && this.currentGrant) {
        this.onRowSelected([this.currentGrant]);
      }
    },
    currentPage() {
      this.setup();
    },
  },
  methods: {
    ...mapActions({
      fetchGrantsInterested: 'grants/fetchGrantsInterested',
      fetchGrantDetails: 'grants/fetchGrantDetails',
      exportCSVRecentActivities: 'grants/exportCSVRecentActivities',
    }),
    linkGen(pageNum) {
      return pageNum === 1 ? '?' : `?page=${pageNum}`;
    },
    setup() {
      this.fetchGrantsInterested({ perPage: this.perPage, currentPage: this.currentPage });
    },
    async onRowSelected(items) {
      const [row] = items;
      if (row) {
        await this.fetchGrantDetails({ grantId: row.grant_id }).then(() => {
          this.selectedGrant = this.currentGrant;
        });
      }
    },
    onRowClicked(item) {
      if (!newGrantsDetailPageEnabled()) {
        return;
      }
      this.$router.push({ name: 'grantDetail', params: { id: item.grant_id } });
    },
    exportCSV() {
      this.exportCSVRecentActivities();
    },
  },
};
</script>

<style scoped>
.left-margin {
  margin-left: auto;
}
</style>
