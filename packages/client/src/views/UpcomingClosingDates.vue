<template>
  <section class="container">
    <b-card class="border-0">
      <h4 class="card-title gutter">Upcoming Closing Dates</h4>
      <ClosingDatesTable id="upcomingGrants" :on-row-clicked="onRowClicked" :on-row-selected="onRowSelected"
                         :closest-grants="closestGrants" :danger-threshold="this.selectedAgency?.danger_threshold" :warning-threshold="this.selectedAgency?.warning_threshold"/>
      <div class="d-flex gutter">
        <b-pagination-nav class="m-0" use-router no-page-detect :value="currentPage" :number-of-pages="numberOfPages"
                          :link-gen="linkGen" first-number
                      last-number first-text="First" prev-text="Prev" next-text="Next" last-text="Last"
                      aria-controls="upcomingGrants"/>
        <div class="my-1 rounded py-1 px-2 page-item">{{ totalUpcomingGrants }} total date{{ totalUpcomingGrants == 1 ? '' : 's' }}</div>
      </div>
    </b-card>
    <GrantDetailsLegacy v-if="!newGrantsDetailPageEnabled" :selected-grant.sync="selectedGrant" />
  </section>
</template>
<style scoped>
.gutter {
  margin-left: .75rem;
}
</style>

<script>
import { mapActions, mapGetters } from 'vuex';
import { newGrantsDetailPageEnabled } from '@/helpers/featureFlags';
import resizableTableMixin from '@/mixin/resizableTable';
import GrantDetailsLegacy from '@/components/Modals/GrantDetailsLegacy.vue';
import ClosingDatesTable from '@/components/ClosingDatesTable.vue';

export default {
  components: { ClosingDatesTable, GrantDetailsLegacy },
  data() {
    return {
      perPage: 10,
      selectedGrant: null,
    };
  },
  mixins: [resizableTableMixin],
  async mounted() {
    await this.setup();
  },
  computed: {
    ...mapGetters({
      currentGrant: 'grants/currentGrant',
      totalUpcomingGrants: 'grants/totalUpcomingGrants',
      selectedAgency: 'users/selectedAgency',
      closestGrants: 'grants/closestGrants',
    }),
    newGrantsDetailPageEnabled() {
      return newGrantsDetailPageEnabled();
    },
    currentPage() {
      return this.$route.query.page || 1;
    },
    numberOfPages() {
      return this.totalUpcomingGrants ? Math.ceil(this.totalUpcomingGrants / this.perPage) : 1;
    },
  },
  watch: {
    async selectedAgency() {
      await this.setup();
    },
    async selectedGrant() {
      if (!this.selectedGrant) {
        await this.fetchClosestGrants();
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
      fetchGrantDetails: 'grants/fetchGrantDetails',
      fetchClosestGrants: 'grants/fetchClosestGrants',
    }),
    linkGen(pageNum) {
      return pageNum === 1 ? '?' : `?page=${pageNum}`;
    },
    async setup() {
      this.fetchClosestGrants({ perPage: this.perPage, currentPage: this.currentPage });
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
      this.$router.push(`grant/${item.grant_id}`);
    },
  },
};
</script>
