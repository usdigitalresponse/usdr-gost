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
      :per-page="perPage"
      :current-page="currentPage"
    >
      <template #cell()="{ field, value, index }">
        <div v-if="yellowDate == true" :style="field.trStyle" v-text="value"></div>
        <div v-if="redDate == true" :style="field.tdStyle" v-text="value"></div>
        <div v-if="(field.key == 'title') && (value == grantsAndIntAgens[index].title)" :style="{color:'#757575'}">{{grantsAndIntAgens[index].interested_agencies}}</div>
      </template>
    </b-table>
    </b-card>
    <b-row align-v="center">
      <b-pagination class="m-0" v-model="currentPage" :per-page="perPage" first-number :total-rows="rows"
        last-number first-text="First" prev-text="Prev" next-text="Next" last-text="Last" :current-page="currentPage"
        aria-controls="upcomingGrants" />
      <b-button class="ml-2" variant="outline-primary disabled">{{ grantsAndIntAgens.length }} of {{ upcomingItems.length }}</b-button>
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
      yellowDate: null,
      redDate: null,
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
  mounted() {
    this.setup();
  },
  computed: {
    ...mapGetters({
      grants: 'grants/grants',
      grantsInterested: 'grants/grantsInterested',
      currentGrant: 'grants/currentGrant',
      totalGrants: 'dashboard/totalGrants',
      totalGrantsMatchingAgencyCriteria: 'dashboard/totalGrantsMatchingAgencyCriteria',
      totalViewedGrants: 'dashboard/totalViewedGrants',
      grantsCreatedInTimeframe: 'dashboard/grantsCreatedInTimeframe',
      grantsCreatedInTimeframeMatchingCriteria: 'dashboard/grantsCreatedInTimeframeMatchingCriteria',
      grantsUpdatedInTimeframe: 'dashboard/grantsUpdatedInTimeframe',
      grantsUpdatedInTimeframeMatchingCriteria: 'dashboard/grantsUpdatedInTimeframeMatchingCriteria',
      selectedAgency: 'users/selectedAgency',
      getClosestGrants: 'dashboard/getClosestGrants',
      agency: 'users/agency',
    }),
    upcomingItems() {
      // https://stackoverflow.com/a/48643055
      return this.getClosestGrants;
    },
    rows() {
      return this.upcomingItems.length;
    },
    // loopAgens() {

    // },
  },
  watch: {
    async selectedAgency() {
      await this.setup();
    },
    upcomingItems() {
      // https://lukashermann.dev/writing/how-to-use-async-await-with-vuejs-components/
      this.formatUpcoming();
    },
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
      fetchDashboard: 'dashboard/fetchDashboard',
      fetchGrantDetails: 'grants/fetchGrantDetails',
      getInterestedAgenciesAction: 'grants/getInterestedAgencies',
      getAgency: 'agencies/getAgency',
      fetchInterestedAgencies: 'grants/fetchInterestedAgencies',
    }),
    setup() {
      this.fetchDashboard();
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
      //                  get threshold of agency
      // console.log(`format date:  ${value}`);
      const warn = this.agency.warning_threshold;
      const danger = this.agency.danger_threshold;
      //                    current date + danger threshold
      // const dangerDate = new Date(new Date().setDate(new Date().getDate() + danger));
      // console.log(`dangerDate  ${dangerDate}`);
      //                grant close date + danger thresh
      const dangerDate2 = new Date(new Date().setDate(new Date(value).getDate() + danger));
      // console.log(`dangerDate2  ${dangerDate2}`);
      //                grant close date + warn thresh
      const warnDate = new Date(new Date().setDate(new Date(value).getDate() + warn));
      // console.log(`warnDate  ${warnDate}`);
      // console.log(`close date format for comp  ${new Date(value)}`);
      //          if the grant close date is <= danger date
      if (new Date(value) <= warnDate && new Date(value) > dangerDate2) {
        this.yellowDate = true;
      } else if ((new Date(value) <= dangerDate2) || (new Date(value) === new Date())) {
        this.redDate = true;
      }
      //                      format date in MM/DD/YY
      const year = value.slice(2, 4);
      const month = value.slice(5, 7);
      const day = value.slice(8, 10);
      const finalDate = [month, day, year].join('/');
      return (`${finalDate}`);
    },
    async formatUpcoming() {
      this.getClosestGrants.map(async (grant, idx) => {
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
