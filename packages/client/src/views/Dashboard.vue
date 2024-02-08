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
                <span id="noRecentActivityMessage" class="gutter-title1 row" v-if="!activityItems?.length">Your {{newTerminologyEnabled ? 'team' : 'agency'}} has no recent activity.</span>
              </div>
              <b-table sticky-header='500px' hover :items='activityItems' :fields='activityFields'
                :sort-by.sync="sortBy" :sort-desc.sync="sortAsc" class='table table-borderless overflow-hidden' thead-class="d-none"
                selectable
                select-mode="single"
                @row-selected="onRowSelected"
                @row-clicked="onRowClicked"
                >
                <template #cell(icon)="list">
                  <div class="gutter-icon row">
                    <b-icon v-if="list.item.interested === 0" icon="x-circle-fill" scale="1" variant="danger"></b-icon>
                    <b-icon v-if="list.item.interested === 1" icon="check-circle-fill" scale="1" variant="success"></b-icon>
                    <b-icon v-if="list.item.interested === 2" icon="arrow-right-circle-fill" scale="1"></b-icon>
                  </div>
                </template>
                <template #cell(agencyAndGrant)="agencies">
                  <div>{{ agencies.item.team }}
                    <span v-if="agencies.item.interested === 0" class="color-red" > <strong> rejected </strong> </span>
                    <span v-if="agencies.item.interested === 1" > is
                    <span class="color-green">
                      <strong> interested </strong>
                    </span> in </span>
                    <span v-if="agencies.item.interested === 2" > was<strong> assigned </strong> </span>{{ agencies.item.grant }}
                  </div>
                </template>
                <template #cell(date)="dates">
                  <div class="color-gray">{{ dates.item.date }}</div>
                </template>
              </b-table>
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
                <span id="noUpcomingCloseDates" class="gutter-title2 row" v-if="!grantsAndIntAgens?.length">Your {{newTerminologyEnabled ? 'team' : 'agency'}} has no upcoming close dates.</span>
              </div>
              <b-table sticky-header='350px' hover :items='grantsAndIntAgens' :fields='upcomingFields'
                class='table table-borderless' thead-class="d-none"
                selectable
                select-mode="single"
                @row-selected="onRowSelected"
                @row-clicked="onRowClicked"
                >
                <template #cell()="{ field, value, index }">
                  <div v-if="field.key === 'title'">{{value}}</div>
                  <div v-if="field.key === 'close_date' && yellowDate === true" :style="field.trStyle" v-text="value"></div>
                  <div v-if="field.key === 'close_date' && redDate === true" :style="field.tdStyle" v-text="value"></div>
                  <div v-if="field.key === 'close_date' && blackDate === true" :style="field.tlStyle" v-text="value"></div>
                  <div v-if="(grantsAndIntAgens[index]) && (field.key === 'title') && (value === grantsAndIntAgens[index].title)" class="color-gray">{{grantsAndIntAgens[index].interested_agencies}}</div>
                </template>
              </b-table>
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
.gutter-icon.row {
    margin-right: -8px;
    margin-left: -8px;
    margin-top: 3px;
  }
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
import { newTerminologyEnabled, newGrantsDetailPageEnabled } from '@/helpers/featureFlags';

export default {
  components: { GrantDetailsLegacy },
  data() {
    return {
      dateColors: [],
      sortBy: 'dateSort',
      sortAsc: true,
      perPage: 4,
      perPageClosest: 3,
      currentPage: 1,
      grantsAndIntAgens: [],
      activityFields: [
        {
          // col for the check or X icon
          key: 'icon',
          label: '',
          // thStyle: { width: '1%' },
        },
        {
          // col for the agency is interested or not in grant
          key: 'agencyAndGrant',
          label: '',
          // thStyle: { width: '79%' },
        },
        {
          // col for when the event being displayed happened
          key: 'date',
          label: '',
          // thStyle: { width: '20%' },
        },
      ],
      upcomingFields: [
        {
          key: 'title',
          label: '',
          thStyle: { width: '80%' },
        },
        {
          key: 'close_date',
          label: '',
          formatter: 'formatDate',
          thStyle: { width: '20%' },
          tdStyle: {
            color: '#C22E31',
            fontWeight: 'bold',
          },
          tlStyle: {
            color: 'black',
          },
          trStyle: {
            color: '#956F0D',
            fontWeight: 'bold',
          },
          fontWeight: 'bold',
        },
        {
          key: 'interested_agencies',
          label: '',
          thClass: 'd-none',
          tdClass: 'd-none',
          thStyle: { width: '20%' },
        },
      ],
      selectedGrant: null,
    };
  },

  mixins: [resizableTableMixin],
  async mounted() {
    await this.setup();
  },
  computed: {
    ...mapGetters({
      totalViewedGrants: 'dashboard/totalViewedGrants',
      totalInterestedGrants: 'grants/totalInterestedGrants',
      totalUpcomingGrants: 'grants/totalUpcomingGrants',
      selectedTeam: 'users/selectedAgency',
      closestGrants: 'grants/closestGrants',
      grants: 'grants/grants',
      grantsInterested: 'grants/grantsInterested',
      team: 'users/agency',
      currentGrant: 'grants/currentGrant',
    }),
    activityItems() {
      const rtf = new Intl.RelativeTimeFormat('en', {
        numeric: 'auto',
      });
      const oneDayInMs = 1000 * 60 * 60 * 24;
      return this.grantsInterested?.map((grantsInterested) => ({
        team: grantsInterested.name,
        grant: grantsInterested.title,
        grant_id: grantsInterested.grant_id,
        interested: (() => {
          let retVal = null;
          if (grantsInterested.status_code != null) {
            if (grantsInterested.status_code === 'Rejected') {
              retVal = 0;
            } else if (grantsInterested.status_code === 'Interested') {
              retVal = 1;
            }
          } else if (grantsInterested.assigned_by != null) {
            // 2 means its assigned not interested
            retVal = 2;
          }
          return retVal;
        })(),
        dateSort: new Date(grantsInterested.created_at).toLocaleString(),
        date: (() => {
          const timeSince = rtf.format(Math.round((new Date(grantsInterested.created_at).getTime() - new Date().getTime()) / oneDayInMs), 'day');
          const timeSinceInt = parseInt(timeSince, 10);
          if (!Number.isNaN(timeSinceInt) && timeSinceInt > 7) {
            return new Date(grantsInterested.created_at).toLocaleDateString('en-US');
          }
          return timeSince.charAt(0).toUpperCase() + timeSince.slice(1);
        })(),
      }));
    },
    upcomingItems() {
      // https://stackoverflow.com/a/48643055
      return this.closestGrants;
    },
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
    upcomingItems() {
      // https://lukashermann.dev/writing/how-to-use-async-await-with-vuejs-components/
      this.formatUpcoming();
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
      fetchDashboard: 'dashboard/fetchDashboard',
      getInterestedAgenciesAction: 'grants/getInterestedAgencies',
      fetchGrantsInterested: 'grants/fetchGrantsInterested',
      fetchGrantDetails: 'grants/fetchGrantDetails',
      fetchClosestGrants: 'grants/fetchClosestGrants',
    }),
    async setup() {
      this.fetchGrantsInterested({ perPage: this.perPage, currentPage: this.currentPage });
      this.fetchClosestGrants({ perPage: this.perPageClosest, currentPage: this.currentPage });
    },
    formatMoney(value) {
      const res = Number(value).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        style: 'currency',
        currency: 'USD',
      });
      return (`(${res})`);
    },
    formatDate(grantCloseDate) {
      const warn = this.team.warning_threshold;
      const danger = this.team.danger_threshold;
      const closeDatePlusDangerThreshold = new Date(new Date().setDate(new Date().getDate() + danger));
      const closeDatePlusWarningThreshold = new Date(new Date().setDate(new Date().getDate() + warn));
      //          if the grant close date is <= danger date---------------
      const days = (aa, bb) => {
        const difference = aa.getTime() - bb.getTime();
        return Math.ceil(difference / (1000 * 3600 * 24));
      };
      const daysTillDanger = days(closeDatePlusDangerThreshold, new Date());
      const daysTillWarn = days(closeDatePlusWarningThreshold, new Date());
      const daysTillClose = days(new Date(grantCloseDate), new Date());
      //                      ---assigning correct colors---
      this.yellowDate = null;
      this.redDate = null;
      this.blackDate = null;
      for (let i = 0; i < this.grantsAndIntAgens.length; i += 1) {
        if ((daysTillClose <= warn) && (daysTillWarn > danger) && ((daysTillClose > danger) || (daysTillDanger <= daysTillClose))) {
          this.yellowDate = true;
          this.redDate = false;
          this.blackDate = false;
        } else if ((daysTillClose <= danger) || (daysTillDanger >= daysTillClose)) {
          this.redDate = true;
          this.yellowDate = false;
          this.blackDate = false;
        } else {
          this.blackDate = true;
          this.redDate = false;
          this.yellowDate = false;
        }
      }
      //                      format date in MM/DD/YY
      const year = grantCloseDate.slice(2, 4);
      const month = grantCloseDate.slice(5, 7);
      const day = grantCloseDate.slice(8, 10);
      const finalDate = [month, day, year].join('/');
      return (`${finalDate}`);
    },
    async formatUpcoming() {
      this.grantsAndIntAgens = [];
      // https://stackoverflow.com/a/67219279
      this.closestGrants.map(async (grant, idx) => {
        const arr = await this.getInterestedAgenciesAction({ grantId: grant.grant_id });
        const updateGrant = {
          ...grant,
          interested_agencies: arr.map((team) => team.agency_abbreviation).join(', '),
        };
        // https://v2.vuejs.org/v2/guide/reactivity.html#For-Arrays
        // https://stackoverflow.com/a/45336400
        this.$set(this.grantsAndIntAgens, idx, updateGrant);
      });
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
      this.$router.push({ name: 'grantDetail', params: { id: item.grant_id, backButton: true } });
    },
  },
};
</script>
