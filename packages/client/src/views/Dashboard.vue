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
              </div>
              <b-table sticky-header='500px' hover :items='activityItems' :fields='activityFields'
                :sort-by.sync="sortBy" :sort-desc.sync="sortAsc" class='table table-borderless overflow-hidden' thead-class="d-none">
                <template #cell(icon)="list">
                  <div class="gutter-icon row">
                  <b-icon v-if="list.item.interested" icon="check-circle-fill" scale="1" variant="success"></b-icon>
                  <b-icon v-else icon="x-circle-fill" scale="1" variant="danger"></b-icon>
                  </div>
                </template>
                <template #cell(agencyAndGrant)="agencies">
                  <div>{{ agencies.item.agency }}
                    <span v-if="agencies.item.interested"> is
                      <span class="color-green"> <strong> interested </strong></span> in
                    </span>
                    <span v-if="!agencies.item.interested" class="color-red" > <strong> rejected </strong> </span>{{ agencies.item.grant }}
                  </div>
                </template>
                <template #cell(date)="dates">
                  <div class="color-gray">{{ dates.item.date }}</div>
                </template>
              </b-table>
              <b-row align-v="center" >
                <b-navbar toggleable="sm py-0" bg-transparent class="gutter-activity row">
                  <a class="nav-link active" href="#/RecentActivity">See All Activity</a>
                </b-navbar>
              </b-row>
            </b-card>
          </b-col>
          <b-col>
            <b-card>
              <div class="card-block text-left">
                <h4 class="card-title gutter-title2 row">Upcoming Closing Dates</h4>
              </div>
              <b-table sticky-header='350px' hover :items='upcomingItems' :fields='upcomingFields'
                class='table table-borderless' thead-class="d-none">
                <template #cell()="{ field, value }">
                  <div v-if="yellowDate == true" :style="field.trStyle" v-text="value"></div>
                  <div v-if="redDate == true" :style="field.tdStyle" v-text="value"></div>
                  <div v-if="(field.key == 'title') && (value == upcomingItems[0].title)" :style="{color:'gray', fontSize: '12px',}">{{upcomingItems[0].interested_agencies}}</div>
                  <div v-if="(field.key == 'title') && (value == upcomingItems[1].title)" :style="{color:'gray', fontSize: '12px',}">{{upcomingItems[1].interested_agencies}}</div>
                  <div v-if="(field.key == 'title') && (value == upcomingItems[2].title)" :style="{color:'gray', fontSize: '12px',}">{{upcomingItems[2].interested_agencies}}</div>
                <!-- <template #cell(date)="dates"><strong> -->
                  <!-- color the date to gray, yellow, or red based on the dateColor boolean -->
                  <!-- <div v-if="dates.item.dateColor === 0" class="color-gray">{{ dates.item.date }}</div>
                  <div v-if="dates.item.dateColor === 1" class="color-yellow">{{ dates.item.date }}</div>
                  <div v-if="dates.item.dateColor === 2" class="color-red">{{ dates.item.date }}</div> -->
                <!-- </strong></template> -->
                <!-- <template #cell(agencyAndGrant)="agencies"> -->
                  <!-- display the interestedAgencies in a new <div> so it appears below the grant -->
                  <!-- <div>{{ agencies.item.agencyAndGrant }}</div>
                  <div class="color-gray">{{ agencies.item.interestedAgencies }}</div> -->
                </template>
              </b-table>
              <b-row align-v="center">
                <b-navbar toggleable="sm py-0" bg-transparent class="gutter-upcoming row">
                  <a class="nav-link active" href="#/UpcomingClosingDates">See All Upcoming</a>
                </b-navbar>
              </b-row>
            </b-card>
          </b-col>
          <b-col cols="1"></b-col>
        </div>
      </b-container>
    </div>

    <b-row>
      <b-col cols='4'>
        <b-card bg-variant='secondary' text-variant='white' header='New Grants Matching Search Criteria, Last 24Hrs'
          class='text-center mb-3 mt-3'>
          <h3>{{ grantsCreatedInTimeframeMatchingCriteria }} of {{ grantsCreatedInTimeframe }}</h3>
          <b-link class='stretched-link' to='/grants' />
        </b-card>
      </b-col>
      <b-col cols='4'>
        <b-card bg-variant='secondary' text-variant='white' header='Updated Grants Matching Search Criteria, Last 24Hrs'
          class='text-center mb-3 mt-3'>
          <h3>{{ grantsUpdatedInTimeframeMatchingCriteria }} of {{ grantsUpdatedInTimeframe }}</h3>
          <b-link class='stretched-link' to='/grants' />
        </b-card>
      </b-col>
      <b-col cols='4'>
        <b-card bg-variant='secondary' text-variant='white' header='Total Grants Matching Search Criteria'
          class='text-center mb-3 mt-3'>
          <h3>{{ totalGrantsMatchingAgencyCriteria }} of {{ totalGrants }}</h3>
          <b-link class='stretched-link' to='/grants' />
        </b-card>
      </b-col>
    </b-row>
    <b-card title="Total Interested Grants by Agencies">
      <b-table sticky-header="600px" hover :items="totalInterestedGrantsByAgencies" :fields="groupByFields">
        <template #cell()="{field, value}">
          <div :style="field.style" v-text="value">
          </div>
        </template>
      </b-table>
    </b-card>
  </section>
</template>

<style scoped>
.color-gray{
  color: #757575;
}
.color-yellow{
  color: #aa8866;
}
.color-red{
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

export default {
  components: {
  },
  data() {
    return {
      yellowDate: null,
      redDate: null,
      sortBy: 'dateSort',
      sortAsc: true,
      perPage: 4,
      currentPage: 1,
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
            color: 'red',
          },
          trStyle: {
            color: 'darkkhaki',
          },
        },
        {
          key: 'interested_agencies',
          label: '',
          thClass: 'd-none',
          tdClass: 'd-none',
          thStyle: { width: '20%' },
        },
      ],
      groupByFields: [
        {
          key: 'name',
          sortable: true,
          thStyle: {
            width: '45%',
          },
        },
        {
          label: 'Total',
          key: 'count',
          sortable: true,
          thStyle: {
            // makes monetary value column closer,
            // also gives more space for grant money value since it will be a longer number
            width: '1%',
          },
        },
        {
          label: ' ',
          key: 'total_grant_money',
          sortByFormatted: false,
          formatter: 'formatMoney',
          style: {
            color: '#757575',
          },
          class: 'text-right',
        },
        {
          key: 'empty1',
          label: '',
          thStyle: {
            width: '11%',
          },
        },
        {
          key: 'interested',
          sortable: true,
          thStyle: {
            // makes monetary value column closer,
            // also gives more space for grant money value since it will be a longer number
            width: '1%',
          },
        },
        {
          label: ' ',
          key: 'total_interested_grant_money',
          sortByFormatted: false,
          formatter: 'formatMoney',
          class: 'text-right',
          style: {
            color: 'green',
          },
        },
        {
          key: 'empty2',
          label: '',
          thStyle: {
            width: '11%',
          },
        },
        {
          key: 'rejections',
          sortable: true,
          thStyle: {
            // makes monetary value column closer,
            // also gives more space for grant money value since it will be a longer number
            width: '1%',
          },
        },
        {
          label: '   ',
          key: 'total_rejected_grant_money',
          sortByFormatted: false,
          formatter: 'formatMoney',
          class: 'text-right',
          style: {
            color: '#ae1818',
          },
        },
        {
          key: 'empty3',
          label: '',
          thStyle: {
            width: '11%',
          },
        },
      ],
    };
  },

  mixins: [resizableTableMixin],
  async mounted() {
    await this.setup();
  },
  computed: {
    ...mapGetters({
      totalGrants: 'dashboard/totalGrants',
      totalGrantsMatchingAgencyCriteria: 'dashboard/totalGrantsMatchingAgencyCriteria',
      totalViewedGrants: 'dashboard/totalViewedGrants',
      totalInterestedGrants: 'dashboard/totalInterestedGrants',
      grantsCreatedInTimeframe: 'dashboard/grantsCreatedInTimeframe',
      grantsCreatedInTimeframeMatchingCriteria: 'dashboard/grantsCreatedInTimeframeMatchingCriteria',
      grantsUpdatedInTimeframe: 'dashboard/grantsUpdatedInTimeframe',
      grantsUpdatedInTimeframeMatchingCriteria: 'dashboard/grantsUpdatedInTimeframeMatchingCriteria',
      totalInterestedGrantsByAgencies: 'dashboard/totalInterestedGrantsByAgencies',
      selectedAgency: 'users/selectedAgency',
      getClosestGrants: 'dashboard/getClosestGrants',
      grants: 'grants/grants',
      loggedInUser: 'users/loggedInUser',
      agency: 'users/agency',
    }),
    upcomingItems() {
      // https://stackoverflow.com/a/48643055
      return this.getClosestGrants;
    },
  },
  watch: {
    async selectedAgency() {
      await this.setup();
    },
    upcomingItems() {
      // https://lukashermann.dev/writing/how-to-use-async-await-with-vuejs-components/
      this.formatUpcoming();
    },
  },
  methods: {
    ...mapActions({
      fetchDashboard: 'dashboard/fetchDashboard',
      getInterestedAgenciesAction: 'grants/getInterestedAgencies',
      getAgency: 'agencies/getAgency',
      fetchInterestedAgencies: 'grants/fetchInterestedAgencies',
    }),
    async setup() {
      this.fetchDashboard();
      this.fetchGrantsInterested({ perPage: this.perPage, currentPage: this.currentPage });
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
      // https://stackoverflow.com/a/67219279
      this.getClosestGrants.slice(0, 3).map(async (grant, idx) => {
        const arr = await this.getInterestedAgenciesAction({ grantId: grant.grant_id });
        const updateGrant = {
          ...grant,
          interested_agencies: arr.slice(0, 3).map((agency) => agency.agency_abbreviation).join(', '),
        };
        // https://v2.vuejs.org/v2/guide/reactivity.html#For-Arrays
        // https://stackoverflow.com/a/45336400
        this.$set(this.upcomingItems, idx, updateGrant);
      });
    },
    seeAllActivity() {
      // this is where the method for the button press will go
    },
    seeAllUpcoming() {
      // this is where the method for the button press will go
    },
  },
};
</script>
