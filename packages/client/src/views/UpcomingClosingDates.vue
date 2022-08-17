<template>
  <section class="container">
    <b-card class="border-0">
      <h4 class="card-title gutter-title1 row">Upcoming Closing Dates</h4>
    <b-table
      hover
      id="upcomingGrants"
      :items="grantsAndIntAgens"
      :fields="upcomingFields"
      :sort-by.sync="sortBy"
      :sort-desc.sync="sortAsc"
      class="table table-borderless"
      thead-class="d-none"
      selectable
      select-mode="single"
      @row-selected="onRowSelected"
    >
      <template #cell()="{ field, value, index }">
        <div v-if="field.key == 'title'">{{value}}</div>
        <div v-if="field.key == 'close_date' && yellowDate == true" :style="field.trStyle" v-text="value"></div>
        <div v-if="field.key == 'close_date' && redDate == true" :style="field.tdStyle" v-text="value"></div>
        <div v-if="field.key == 'close_date' && blackDate == true" :style="field.tlStyle" v-text="value"></div>
        <div v-if="(grantsAndIntAgens[index]) && (field.key == 'title') && (value == grantsAndIntAgens[index].title)" :style="{color:'#757575'}">{{grantsAndIntAgens[index].interested_agencies}}</div>
      </template>
    </b-table>
    </b-card>
    <b-row align-v="center">
      <b-pagination class="m-0" v-model="currentPage" :per-page="perPage" first-number :total-rows="totalRows"
        last-number first-text="First" prev-text="Prev" next-text="Next" last-text="Last" :current-page="currentPage"
        aria-controls="upcomingGrants" />
      <b-button class="ml-2" variant="outline-primary disabled">{{ upcomingItems.length }} of {{ totalRows }}</b-button>
    </b-row>
    <GrantDetails :selected-grant.sync="selectedGrant" />
  </section>
</template>
<style scoped>
.color-gray {
  color: #757575
}
.color-red {
  color: #ae1818;
}
.color-green {
  color: green;
}
.gutter-icon.row {
    margin-right: -8px;
    margin-left: -8px;
    margin-top: 3px;
  }
   .gutter-title1.row {
    margin-left: +4px;
  }
</style>

<script>
import { mapActions, mapGetters } from 'vuex';
import resizableTableMixin from '@/mixin/resizableTable';
import GrantDetails from '@/components/Modals/GrantDetails.vue';

export default {
  components: { GrantDetails },
  data() {
    return {
      // yellowDate: null,
      // redDate: null,
      // blackDate: null,
      perPage: 10,
      currentPage: 1,
      sortBy: 'dateSort',
      sortAsc: true,
      grantsAndIntAgens: [],
      upcomingFields: [
        {
          // col for Grants and interested agencies
          key: 'title',
          label: '',
          thStyle: { width: '80%' },
        },
        {
          // col for when the grant will be closing
          key: 'close_date',
          label: '',
          formatter: 'formatDate',
          thStyle: { width: '20%' },
          tdStyle: {
            color: '#ae1818',
            fontWeight: 'bold',
          },
          trStyle: {
            color: '#aa8866',
            fontWeight: 'bold',
          },
          tlStyle: {
            color: 'black',
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
      grants: 'grants/grants',
      grantsInterested: 'grants/grantsInterested',
      currentGrant: 'grants/currentGrant',
      totalGrants: 'dashboard/totalGrants',
      totalUpcomingGrants: 'grants/totalUpcomingGrants',
      totalGrantsMatchingAgencyCriteria: 'dashboard/totalGrantsMatchingAgencyCriteria',
      totalViewedGrants: 'dashboard/totalViewedGrants',
      grantsCreatedInTimeframe: 'dashboard/grantsCreatedInTimeframe',
      grantsCreatedInTimeframeMatchingCriteria: 'dashboard/grantsCreatedInTimeframeMatchingCriteria',
      grantsUpdatedInTimeframe: 'dashboard/grantsUpdatedInTimeframe',
      grantsUpdatedInTimeframeMatchingCriteria: 'dashboard/grantsUpdatedInTimeframeMatchingCriteria',
      selectedAgency: 'users/selectedAgency',
      closestGrants: 'grants/closestGrants',
      agency: 'users/agency',
    }),
    upcomingItems() {
      return this.closestGrants;
    },
    totalRows() {
      return this.totalUpcomingGrants;
    },
  },
  watch: {
    async selectedAgency() {
      await this.setup();
    },
    upcomingItems() {
      this.formatUpcoming();
      this.formatDate();
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
      fetchDashboard: 'dashboard/fetchDashboard',
      fetchGrantDetails: 'grants/fetchGrantDetails',
      getInterestedAgenciesAction: 'grants/getInterestedAgencies',
      getAgency: 'agencies/getAgency',
      fetchInterestedAgencies: 'grants/fetchInterestedAgencies',
      fetchClosestGrants: 'grants/fetchClosestGrants',
    }),
    async setup() {
      this.fetchDashboard();
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
    formatDate(value) {
      // value is the close date of grant
      //                  get threshold of agency
      const warn = this.agency.warning_threshold;
      const danger = this.agency.danger_threshold;
      //                grant close date + danger thresh
      const dangerDate = new Date(new Date().setDate(new Date().getDate() + danger));
      //                grant close date + warn thresh
      const warnDate = new Date(new Date().setDate(new Date().getDate() + warn));
      //          if the grant close date is <= danger date---------------
      const days = (aa, bb) => {
        const difference = aa.getTime() - bb.getTime();
        const TotalDays = Math.ceil(difference / (1000 * 3600 * 24));
        return TotalDays;
      };
      const daysTillDanger = days(dangerDate, new Date());
      const daysTillWarn = days(warnDate, new Date());
      const daysTillClose = days(new Date(value), new Date());
      //                      ---assigning correct colors---
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
      const year = value.slice(2, 4);
      const month = value.slice(5, 7);
      const day = value.slice(8, 10);
      const finalDate = [month, day, year].join('/');
      return (`${finalDate}`);
    },
    async formatUpcoming() {
      this.grantsAndIntAgens = [];
      this.closestGrants.map(async (grant, idx) => {
        const arr = await this.getInterestedAgenciesAction({ grantId: grant.grant_id });
        const updateGrant = {
          ...grant,
          interested_agencies: arr.map((agency) => agency.agency_abbreviation).join(', '),
        };
        this.$set(this.grantsAndIntAgens, idx, updateGrant);
      });
    },
  },
};
</script>
