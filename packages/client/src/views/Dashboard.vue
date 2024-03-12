<!-- eslint-disable max-len -->
<template>
  <section class='m-3'>
    <div class="px-5">
      <b-container fluid>
        <div class="row">
          <b-col cols="1"></b-col>
          <b-col>
            <b-card>
              <div class="card-block text-left">
                <h4 class="card-title gutter-title1 row">Recent Activity</h4>
                <span id="noRecentActivityMessage" class="gutter-title1 row" v-if="!grantsInterested?.length">Your {{newTerminologyEnabled ? 'team' : 'agency'}} has no recent activity.</span>
              </div>
              <ActivityTable :grants-interested="grantsInterested" :on-row-clicked="onRowClicked" :on-row-selected="onRowSelected"/>
              <div v-if="totalInterestedGrants > 4">
                <b-row align-v="center" >
                  <b-navbar toggleable="sm py-0" bg-transparent class="gutter-activity row">
                    <b-link class="nav-link active" to="RecentActivity">See All Activity</b-link>
                  </b-navbar>
                </b-row>
              </div>
            </b-card>
          </b-col>
          <b-col>
            <b-card>
              <div class="card-block text-left">
                <h2 class="card-title gutter-title2 row h4">Upcoming Closing Dates</h2>
                <span id="noUpcomingCloseDates" class="gutter-title2 row" v-if="!closestGrants?.length">Your {{newTerminologyEnabled ? 'team' : 'agency'}} has no upcoming close dates.</span>
              </div>
              <ClosingDatesTable :closest-grants="closestGrants" :on-row-clicked="onRowClicked" :on-row-selected="onRowSelected"
                                 :danger-threshold="this.selectedTeam?.danger_threshold" :warning-threshold="this.selectedTeam?.warning_threshold" />
              <div v-if="totalUpcomingGrants > 3">
                <b-row align-v="center">
                  <b-navbar toggleable="sm py-0" bg-transparent class="gutter-upcoming row">
                    <b-link class="nav-link active" to="UpcomingClosingDates">See All Upcoming</b-link>
                  </b-navbar>
                </b-row>
              </div>
            </b-card>
          </b-col>
          <b-col cols="1"></b-col>
        </div>
      </b-container>
    </div>
    <br/>

    <GrantDetailsLegacy v-if="!newGrantsDetailPageEnabled" :selected-grant.sync="selectedGrant" />
  </section>
</template>

<style scoped>
  .gutter-activity.row {
    margin-left: -10px;
    margin-top: -8px;
    margin-bottom: -6px;
  }
  .gutter-upcoming.row {
    margin-left: -2px;
    margin-top: -8px;
    margin-bottom: -6px;
  }
  .gutter-title1.row {
    margin-left: +4px;
  }
  .gutter-title2.row {
    margin-left: +10px;
  }

</style>

<script>
import { mapActions, mapGetters } from 'vuex';
import resizableTableMixin from '@/mixin/resizableTable';
import GrantDetailsLegacy from '@/components/Modals/GrantDetailsLegacy.vue';
import ActivityTable from '@/components/ActivityTable.vue';
import ClosingDatesTable from '@/components/ClosingDatesTable.vue';
import { newTerminologyEnabled, newGrantsDetailPageEnabled } from '@/helpers/featureFlags';

export default {
  components: { ClosingDatesTable, ActivityTable, GrantDetailsLegacy },
  data() {
    return {
      perPage: 4,
      perPageClosest: 3,
      currentPage: 1,
      selectedGrant: null,
    };
  },

  mixins: [resizableTableMixin],
  async mounted() {
    await this.setup();
  },
  computed: {
    ...mapGetters({
      totalInterestedGrants: 'grants/totalInterestedGrants',
      totalUpcomingGrants: 'grants/totalUpcomingGrants',
      selectedTeam: 'users/selectedAgency',
      closestGrants: 'grants/closestGrants',
      grantsInterested: 'grants/grantsInterested',
      currentGrant: 'grants/currentGrant',
    }),
    newTerminologyEnabled() {
      return newTerminologyEnabled();
    },
    newGrantsDetailPageEnabled() {
      return newGrantsDetailPageEnabled();
    },
  },
  watch: {
    async selectedTeam() {
      await this.setup();
    },
    async selectedGrant() {
      if (!this.selectedGrant) {
        await this.fetchGrantsInterested();
        await this.fetchClosestGrants();
      }
    },
    currentGrant() {
      if (this.selectedGrant && this.currentGrant) {
        this.onRowSelected([this.currentGrant]);
      }
    },
  },
  methods: {
    ...mapActions({
      fetchGrantsInterested: 'grants/fetchGrantsInterested',
      fetchGrantDetails: 'grants/fetchGrantDetails',
      fetchClosestGrants: 'grants/fetchClosestGrants',
    }),
    async setup() {
      this.fetchGrantsInterested({ perPage: this.perPage, currentPage: this.currentPage });
      this.fetchClosestGrants({ perPage: this.perPageClosest, currentPage: this.currentPage });
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
  },
};
</script>
